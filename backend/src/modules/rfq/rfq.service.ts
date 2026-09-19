import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { SafeUser } from "../../shared/types/index.js";
import { rfqRepository } from "./rfq.repository";
import { quotationRepository } from "../quotation/quotation.repository";
import { approvalRepository } from "../approval/approval.repository";
import { processDueRfqs, resolveRfqDeadlineState } from "./rfq.state-helpers";
import { notificationService } from "../notification/notification.service";
import { notificationRepository } from "../notification/notification.repository";
import { purchaseOrderService } from "../purchase-order/purchase-order.service";
import {
  saveFile,
  deleteFile,
  getFilePath,
} from "../../infrastructure/storage/storage";
import { CreateRfqInput, UpdateRfqInput, RfqQuery } from "./rfq.schema";

const INTERNAL_ROLES = ["ADMIN", "OFFICR", "MANAGER"];

function isInternal(user: SafeUser) {
  return INTERNAL_ROLES.includes(user.role);
}

function effectiveStatus(
  status: string,
  deadline: Date | null,
  now: Date,
): string {
  if (status === "PUBLISHED") {
    return deadline && deadline <= now ? "CLOSED" : "OPEN";
  }
  return status;
}

class RfqService {
  async create(user: SafeUser, input: CreateRfqInput, publish: boolean) {
    const rfqNumber = await rfqRepository.generateRfqNumber();
    const vendorIds = input.vendorIds ?? [];

    if (publish) {
      await this.assertPublishable({
        items: input.items,
        deadline: input.deadline ? new Date(input.deadline) : null,
        vendorCount: vendorIds.length,
      });
    }

    if (vendorIds.length > 0) {
      const validVendors = await rfqRepository.findVendorUsersByIds(
        vendorIds,
        user.organizationId,
      );
      if (validVendors.length !== vendorIds.length) {
        throw AppError.badRequest(
          "One or more vendors are invalid or inactive",
          "INVALID_VENDOR",
        );
      }
    }

    const rfq = await rfqRepository.create({
      rfqNumber,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "MEDIUM",
      quotationDeadline: input.deadline ? new Date(input.deadline) : undefined,
      expectedDeliveryDate: input.expectedDeliveryDate
        ? new Date(input.expectedDeliveryDate)
        : undefined,
      requestedById: user.id,
      organizationId: user.organizationId,
      items: input.items.map((item) => ({
        ...item,
        expectedDeliveryDate: item.expectedDeliveryDate
          ? new Date(item.expectedDeliveryDate)
          : undefined,
      })),
      vendorIds,
    });

    await rfqRepository.createActivity(
      rfq.id,
      user.id,
      "RFQ_CREATED",
      `RFQ ${rfqNumber} created`,
    );
    const baseLink = `/rfqs/${rfq.id}`;

    if (publish) {
      await this.publish(user, rfq.id);
    }

    return this.getDetail(user, rfq.id);
  }

  private async assertPublishable(args: {
    items: unknown[];
    deadline: Date | null;
    vendorCount: number;
    publication?: {
      id: number;
      items: unknown[];
      quotationDeadline: Date | null;
      vendors: unknown[];
    } | null;
  }) {
    const items = args.publication?.items ?? args.items;
    const deadline = args.publication?.quotationDeadline ?? args.deadline;
    const vendorCount = args.publication?.vendors?.length ?? args.vendorCount;

    if (!items || items.length === 0) {
      throw AppError.badRequest(
        "At least one item is required before publishing",
        "RFQ_ITEMS_REQUIRED",
      );
    }
    if (!deadline) {
      throw AppError.badRequest(
        "A quotation deadline is required before publishing",
        "RFQ_DEADLINE_REQUIRED",
      );
    }
    if (deadline <= new Date()) {
      throw AppError.badRequest(
        "Quotation deadline must be in the future",
        "RFQ_DEADLINE_IN_PAST",
      );
    }
    if (vendorCount === 0) {
      throw AppError.badRequest(
        "At least one vendor must be invited before publishing",
        "VENDORS_REQUIRED",
      );
    }
  }

  async publish(user: SafeUser, rfqId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.status !== "DRAFT") {
      throw AppError.conflict(
        `Only draft RFQs can be published (current: ${rfq.status})`,
        "INVALID_RFQ_STATE",
      );
    }

    await this.assertPublishable({
      items: [],
      deadline: null,
      vendorCount: 0,
      publication: rfq,
    });

    const invitedVendorIds = rfq.vendors.map((v) => v.vendorId);
    const validVendors = await rfqRepository.findVendorUsersByIds(
      invitedVendorIds,
      user.organizationId,
    );
    if (validVendors.length !== invitedVendorIds.length) {
      throw AppError.badRequest(
        "One or more invited vendors are no longer valid or active",
        "INVALID_VENDOR",
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await rfqRepository.update(
        rfqId,
        { status: "PUBLISHED", publishedAt: now },
        tx,
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_PUBLISHED",
        `RFQ published`,
        tx,
      );
    });

    await notificationService.notifyMany(
      invitedVendorIds,
      "RFQ_PUBLISHED",
      `RFQ ${rfq.rfqNumber} is open for quotations`,
      `Submit your quotation before ${rfq.quotationDeadline?.toISOString()}`,
      `/rfqs/${rfqId}`,
    );

    return this.getDetail(user, rfqId);
  }

  async update(user: SafeUser, rfqId: number, input: UpdateRfqInput) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.status !== "DRAFT") {
      throw AppError.conflict(
        "Only draft RFQs can be edited",
        "RFQ_NOT_EDITABLE",
      );
    }

    await prisma.$transaction(async (tx) => {
      await rfqRepository.update(
        rfqId,
        {
          title: input.title,
          description: input.description,
          priority: input.priority,
          quotationDeadline: input.deadline
            ? new Date(input.deadline)
            : undefined,
          expectedDeliveryDate:
            input.expectedDeliveryDate === null
              ? null
              : input.expectedDeliveryDate
                ? new Date(input.expectedDeliveryDate)
                : undefined,
          items: input.items
            ? {
                deleteMany: {},
                create: input.items.map((item) => ({
                  productId: item.productId,
                  name: item.name,
                  description: item.description,
                  quantity: item.quantity,
                  unit: item.unit,
                  technicalRequirements: item.technicalRequirements,
                  expectedDeliveryDate: item.expectedDeliveryDate
                    ? new Date(item.expectedDeliveryDate)
                    : undefined,
                })),
              }
            : undefined,
        },
        tx,
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_UPDATED",
        `RFQ ${rfq.rfqNumber} updated`,
        tx,
      );
    });

    return this.getDetail(user, rfqId);
  }

  async cancel(user: SafeUser, rfqId: number, reason: string) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (
      rfq.status === "CANCELLED" ||
      rfq.status === "EXPIRED" ||
      rfq.status === "AWARDED"
    ) {
      throw AppError.conflict(
        `RFQ is already ${rfq.status}`,
        "INVALID_RFQ_STATE",
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await rfqRepository.update(
        rfqId,
        {
          status: "CANCELLED",
          cancelledAt: now,
          cancellationReason: reason,
          closedAt:
            rfq.status === "PUBLISHED" || rfq.status === "OPEN"
              ? now
              : undefined,
        },
        tx,
      );
      await rfqRepository.updateInvitationsForRfq(
        rfqId,
        { status: "EXPIRED" },
        { status: { in: ["INVITED", "VIEWED"] } },
        tx,
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_CANCELLED",
        reason,
        tx,
      );
    });

    await notificationService.notifyMany(
      rfq.vendors
        .filter((v) => v.status !== "QUOTATION_SUBMITTED")
        .map((v) => v.vendorId),
      "RFQ_CANCELLED",
      `RFQ ${rfq.rfqNumber} cancelled`,
      reason,
      `/rfqs/${rfqId}`,
    );

    return this.getDetail(user, rfqId);
  }

  async close(user: SafeUser, rfqId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.status !== "PUBLISHED" && rfq.status !== "OPEN") {
      throw AppError.conflict(
        "Only published RFQs can be closed early",
        "INVALID_RFQ_STATE",
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await rfqRepository.update(
        rfqId,
        { status: "CLOSED", closedAt: now },
        tx,
      );
      await rfqRepository.updateInvitationsForRfq(
        rfqId,
        { status: "EXPIRED" },
        { status: { in: ["INVITED", "VIEWED"] } },
        tx,
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_CLOSED",
        "RFQ closed early by officer",
        tx,
      );
    });

    return this.getDetail(user, rfqId);
  }

  async review(user: SafeUser, rfqId: number) {
    let rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }

    if (rfq.status === "PUBLISHED" || rfq.status === "OPEN") {
      const resolved = await resolveRfqDeadlineState(rfq);
      if (resolved.rfq) rfq = resolved.rfq;
    }

    if (!rfq) {
      throw AppError.internal(
        "Failed to resolve RFQ deadline state",
        "RFQ_STATE_ERROR",
      );
    }

    if (rfq.status === "UNDER_REVIEW") {
      return this.getDetail(user, rfqId);
    }
    if (rfq.status !== "CLOSED") {
      throw AppError.conflict(
        "Only closed RFQs can be moved to review",
        "INVALID_RFQ_STATE",
      );
    }

    await rfqRepository.update(rfqId, { status: "UNDER_REVIEW" });
    await rfqRepository.createActivity(
      rfqId,
      user.id,
      "RFQ_UNDER_REVIEW",
      "RFQ moved to review",
    );
    return this.getDetail(user, rfqId);
  }

  async list(user: SafeUser, query: RfqQuery) {
    const {
      page,
      limit,
      search,
      status,
      priority,
      vendorId,
      createdFrom,
      createdTo,
      deadlineFrom,
      deadlineTo,
      sortBy,
      order,
    } = query;
    const skip = (page - 1) * limit;
    const where: any = { organizationId: user.organizationId };

    if (user.role === "VENDOR") {
      where.vendors = { some: { vendorId: user.id } };
      where.status = { not: "DRAFT" };
    } else if (user.role === "OFFICR") {
      where.requestedById = user.id;
    } else if (user.role === "MANAGER") {
      where.status = { not: "DRAFT" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { rfqNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (vendorId && user.role !== "VENDOR")
      where.vendors = { some: { vendorId } };
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) where.createdAt.lte = new Date(createdTo);
    }
    if (deadlineFrom || deadlineTo) {
      where.quotationDeadline = {};
      if (deadlineFrom) where.quotationDeadline.gte = new Date(deadlineFrom);
      if (deadlineTo) where.quotationDeadline.lte = new Date(deadlineTo);
    }

    const [rfqs, total] = await Promise.all([
      rfqRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order } as any,
      }),
      rfqRepository.count(where),
    ]);

    const now = new Date();
    const data = (rfqs as any[]).map((rfq) => ({
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      title: rfq.title,
      description: rfq.description,
      status: rfq.status,
      effectiveStatus: effectiveStatus(rfq.status, rfq.quotationDeadline, now),
      priority: rfq.priority,
      requestedById: rfq.requestedById,
      quotationDeadline: rfq.quotationDeadline,
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
      itemCount: rfq._count?.items ?? 0,
      invitingVendorCount: rfq._count?.vendors ?? 0,
      quotationCount: rfq._count?.quotations ?? 0,
      requestedBy: rfq.requestedBy,
    }));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDetail(user: SafeUser, rfqId: number) {
    let rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.organizationId !== user.organizationId) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }

    if (user.role === "VENDOR") {
      const invitation = rfq.vendors.find((v) => v.vendorId === user.id);
      if (!invitation) {
        throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
      }
      if (rfq.status === "DRAFT") {
        throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
      }

      const now = new Date();
      if (!invitation.viewedAt) {
        await rfqRepository.updateInvitation(rfqId, user.id, { viewedAt: now });
        await rfqRepository.createActivity(
          rfqId,
          user.id,
          "RFQ_VIEWED",
          `RFQ viewed by ${user.name}`,
        );
        rfq = await rfqRepository.findUniqueById(rfqId);
        if (!rfq) throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
      }

      const ownInvitation = rfq.vendors.find((v) => v.vendorId === user.id);
      const ownQuotation = rfq.quotations.find((q) => q.vendorId === user.id);

      return {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status,
        effectiveStatus: effectiveStatus(
          rfq.status,
          rfq.quotationDeadline,
          new Date(),
        ),
        priority: rfq.priority,
        requestedBy: rfq.requestedBy
          ? { id: rfq.requestedBy.id, name: rfq.requestedBy.name }
          : null,
        quotationDeadline: rfq.quotationDeadline,
        expectedDeliveryDate: rfq.expectedDeliveryDate,
        publishedAt: rfq.publishedAt,
        closedAt: rfq.closedAt,
        cancelledAt: rfq.cancelledAt,
        cancellationReason: rfq.cancellationReason,
        createdAt: rfq.createdAt,
        updatedAt: rfq.updatedAt,
        items: rfq.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          technicalRequirements: item.technicalRequirements,
          expectedDeliveryDate: item.expectedDeliveryDate,
        })),
        attachments: rfq.attachments.map((a: any) => ({
          id: a.id,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
          uploadedBy: a.uploadedBy
            ? { id: a.uploadedBy.id, name: a.uploadedBy.name }
            : null,
          createdAt: a.createdAt,
        })),
        vendors: [],
        quotations: [],
        ownInvitation: ownInvitation
          ? {
              id: ownInvitation.id,
              status: ownInvitation.status,
              invitedAt: ownInvitation.invitedAt,
              viewedAt: ownInvitation.viewedAt,
              respondedAt: ownInvitation.respondedAt,
              declineReason: ownInvitation.declineReason,
            }
          : null,
        ownQuotation: ownQuotation
          ? {
              id: ownQuotation.id,
              status: ownQuotation.status,
              totalAmount: ownQuotation.totalAmount?.toString() ?? null,
              currency: ownQuotation.currency,
              submittedAt: ownQuotation.submittedAt,
            }
          : null,
        activities: [],
        approvals: [],
      };
    }

    const now = new Date();
    let effective: string = rfq.status;
    if (
      rfq.status === "PUBLISHED" &&
      rfq.quotationDeadline &&
      rfq.quotationDeadline <= now
    ) {
      const resolved = await resolveRfqDeadlineState(rfq);
      if (resolved.rfq) rfq = resolved.rfq;
      if (!rfq) {
        throw AppError.internal(
          "Failed to resolve RFQ deadline state",
          "RFQ_STATE_ERROR",
        );
      }
    }
    effective = effectiveStatus(rfq.status, rfq.quotationDeadline, now);

    return {
      id: rfq.id,
      rfqNumber: rfq.rfqNumber,
      title: rfq.title,
      description: rfq.description,
      status: rfq.status,
      effectiveStatus: effective,
      priority: rfq.priority,
      requestedBy: rfq.requestedBy,
      quotationDeadline: rfq.quotationDeadline,
      expectedDeliveryDate: rfq.expectedDeliveryDate,
      publishedAt: rfq.publishedAt,
      closedAt: rfq.closedAt,
      cancelledAt: rfq.cancelledAt,
      cancellationReason: rfq.cancellationReason,
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
      items: rfq.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        technicalRequirements: item.technicalRequirements,
        expectedDeliveryDate: item.expectedDeliveryDate,
      })),
      attachments: rfq.attachments.map((a: any) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        uploadedBy: a.uploadedBy,
        createdAt: a.createdAt,
      })),
      vendors: rfq.vendors.map((v: any) => ({
        id: v.id,
        vendor: v.vendor,
        status: v.status,
        invitedAt: v.invitedAt,
        viewedAt: v.viewedAt,
        respondedAt: v.respondedAt,
        declineReason: v.declineReason,
      })),
      quotations: rfq.quotations.map((q: any) => ({
        id: q.id,
        vendorId: q.vendorId,
        vendorName: q.vendor?.name,
        status: q.status,
        totalAmount: q.totalAmount?.toString() ?? null,
        currency: q.currency,
        submittedAt: q.submittedAt,
      })),
      ownInvitation: null,
      ownQuotation: null,
      activities: rfq.activities.map((a: any) => ({
        id: a.id,
        event: a.event,
        details: a.details,
        user: a.user,
        createdAt: a.createdAt,
      })),
      approvals: rfq.approvals.map((ap: any) => ({
        id: ap.id,
        quotationId: ap.quotationId,
        status: ap.status,
        requestedAt: ap.requestedAt,
        decidedAt: ap.decidedAt,
        comment: ap.comment,
        requestedBy: ap.requestedBy,
        approvedBy: ap.approvedBy,
      })),
    };
  }

  async addVendor(user: SafeUser, rfqId: number, vendorId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (
      rfq.status === "CANCELLED" ||
      rfq.status === "EXPIRED" ||
      rfq.status === "AWARDED"
    ) {
      throw AppError.conflict(
        `RFQ is ${rfq.status}; vendors cannot be added`,
        "INVALID_RFQ_STATE",
      );
    }

    const vendor = await rfqRepository.findActiveVendorById(
      vendorId,
      user.organizationId,
    );
    if (!vendor) {
      throw AppError.badRequest(
        "Vendor is not found, inactive, or has no profile",
        "INVALID_VENDOR",
      );
    }

    const existing = await rfqRepository.findInvitation(rfqId, vendorId);
    if (existing) {
      throw AppError.conflict(
        "Vendor is already invited",
        "VENDOR_ALREADY_INVITED",
      );
    }

    await prisma.$transaction(async (tx) => {
      await rfqRepository.createInvitation(rfqId, vendorId, tx);
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "VENDOR_INVITED",
        `Vendor ${vendor.name} invited`,
        tx,
      );
    });

    if (rfq.status === "PUBLISHED" || rfq.status === "OPEN") {
      await notificationService.notify(
        vendorId,
        "VENDOR_INVITED",
        `You are invited to RFQ ${rfq.rfqNumber}`,
        `Submit your quotation before ${rfq.quotationDeadline?.toISOString()}`,
        `/rfqs/${rfqId}`,
      );
    }

    return this.getDetail(user, rfqId);
  }

  async removeVendor(user: SafeUser, rfqId: number, vendorId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (
      rfq.status === "CANCELLED" ||
      rfq.status === "EXPIRED" ||
      rfq.status === "AWARDED"
    ) {
      throw AppError.conflict(
        `RFQ is ${rfq.status}; vendors cannot be removed`,
        "INVALID_RFQ_STATE",
      );
    }

    const invitation = await rfqRepository.findInvitation(rfqId, vendorId);
    if (!invitation) {
      throw AppError.notFound(
        "Vendor is not invited to this RFQ",
        "VENDOR_NOT_INVITED",
      );
    }
    if (invitation.status === "QUOTATION_SUBMITTED") {
      throw AppError.conflict(
        "Vendor has already submitted a quotation and cannot be removed",
        "VENDOR_HAS_QUOTATION",
      );
    }

    await prisma.$transaction(async (tx) => {
      await rfqRepository.deleteInvitation(rfqId, vendorId, tx);
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_UPDATED",
        `Vendor #${vendorId} removed from RFQ`,
        tx,
      );
    });

    return this.getDetail(user, rfqId);
  }

  async decline(user: SafeUser, rfqId: number, reason?: string) {
    const invitation = await rfqRepository.findInvitation(rfqId, user.id);
    if (!invitation) {
      throw AppError.forbidden(
        "You are not invited to this RFQ",
        "NOT_INVITED",
      );
    }
    if (invitation.status === "DECLINED") {
      throw AppError.conflict(
        "You have already declined this invitation",
        "INVITATION_DECLINED",
      );
    }
    if (invitation.status === "QUOTATION_SUBMITTED") {
      throw AppError.conflict(
        "You have already submitted a quotation; use cancel instead",
        "QUOTATION_ALREADY_SUBMITTED",
      );
    }

    await prisma.$transaction(async (tx) => {
      await rfqRepository.updateInvitation(
        rfqId,
        user.id,
        {
          status: "DECLINED",
          respondedAt: new Date(),
          declineReason: reason ?? null,
        },
        tx,
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_UPDATED",
        `Vendor declined the invitation: ${reason ?? "no reason"}`,
        tx,
      );
    });
  }

  async uploadAttachment(
    user: SafeUser,
    rfqId: number,
    file: { buffer: Buffer; filename: string; mimeType: string },
  ) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (
      rfq.status === "CANCELLED" ||
      rfq.status === "EXPIRED" ||
      rfq.status === "AWARDED"
    ) {
      throw AppError.conflict(
        `RFQ is ${rfq.status}; attachments cannot be added`,
        "INVALID_RFQ_STATE",
      );
    }

    const stored = saveFile({
      buffer: file.buffer,
      filename: file.filename,
      mimeType: file.mimeType,
    });
    const attachment = await rfqRepository.createAttachment({
      rfqId,
      filename: stored.filename,
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      size: stored.size,
      uploadedById: user.id,
    });
    await rfqRepository.createActivity(
      rfqId,
      user.id,
      "ATTACHMENT_UPLOADED",
      `Attachment "${stored.filename}" uploaded`,
    );

    return attachment;
  }

  async deleteAttachment(user: SafeUser, rfqId: number, attachmentId: number) {
    const attachment = await rfqRepository.findAttachment(attachmentId);
    if (!attachment || attachment.rfqId !== rfqId) {
      throw AppError.notFound("Attachment not found", "ATTACHMENT_NOT_FOUND");
    }
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (
      rfq.status !== "DRAFT" &&
      rfq.status !== "PUBLISHED" &&
      rfq.status !== "OPEN"
    ) {
      throw AppError.conflict(
        "Attachments can only be removed while the RFQ is a draft or open",
        "INVALID_RFQ_STATE",
      );
    }

    await rfqRepository.deleteAttachment(attachmentId);
    deleteFile(attachment.storageKey);
    await rfqRepository.createActivity(
      rfqId,
      user.id,
      "RFQ_UPDATED",
      `Attachment "${attachment.filename}" removed`,
    );
  }

  async getAttachment(user: SafeUser, rfqId: number, attachmentId: number) {
    const attachment = await rfqRepository.findAttachment(attachmentId);
    if (!attachment || attachment.rfqId !== rfqId) {
      throw AppError.notFound("Attachment not found", "ATTACHMENT_NOT_FOUND");
    }

    if (user.role === "VENDOR") {
      const rfq = await rfqRepository.findUniqueById(rfqId);
      if (!rfq || rfq.status === "DRAFT") {
        throw AppError.notFound("Attachment not found", "ATTACHMENT_NOT_FOUND");
      }
      const invitation = await rfqRepository.findInvitation(rfqId, user.id);
      if (!invitation) {
        throw AppError.forbidden(
          "You are not invited to this RFQ",
          "NOT_INVITED",
        );
      }
    }

    return {
      path: getFilePath(attachment.storageKey),
      filename: attachment.filename,
      mimeType: attachment.mimeType,
    };
  }

  async award(user: SafeUser, rfqId: number, quotationId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (
      rfq.status === "CANCELLED" ||
      rfq.status === "EXPIRED" ||
      rfq.status === "AWARDED"
    ) {
      throw AppError.conflict(
        `RFQ is ${rfq.status}; it cannot be awarded`,
        "INVALID_RFQ_STATE",
      );
    }
    if (rfq.status !== "SHORTLISTED" && rfq.status !== "AWAITING_APPROVAL") {
      throw AppError.conflict(
        "RFQ must be shortlisted before it can be awarded",
        "INVALID_RFQ_STATE",
      );
    }

    const quotation = await quotationRepository.findById(quotationId);
    if (!quotation || quotation.rfqId !== rfqId) {
      throw AppError.notFound(
        "Quotation not found for this RFQ",
        "QUOTATION_NOT_FOUND",
      );
    }

    const approval = await approvalRepository.findByRfq(rfqId);
    if (!approval || approval.quotationId !== quotationId) {
      throw AppError.conflict(
        "No approval exists for this quotation",
        "APPROVAL_NOT_FOUND",
      );
    }
    if (approval.status !== "APPROVED") {
      throw AppError.conflict(
        "Quotation must be approved before being awarded",
        "APPROVAL_REQUIRED",
      );
    }
    if (quotation.status !== "APPROVED") {
      throw AppError.conflict(
        "Quotation must be approved before being awarded",
        "INVALID_QUOTATION_STATE",
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await quotationRepository.updateStatus(quotationId, "AWARDED", tx);
      await quotationRepository.updateMany(
        {
          rfqId,
          id: { not: quotationId },
          status: { in: ["SUBMITTED", "SHORTLISTED", "APPROVED"] },
        },
        { status: "REVOKED" },
        tx,
      );
      await rfqRepository.update(rfqId, { status: "AWARDED" }, tx);
      await rfqRepository.updateInvitationsForRfq(
        rfqId,
        { status: "EXPIRED" },
        { status: { in: ["INVITED", "VIEWED"] } },
        tx,
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "RFQ_AWARDED",
        `RFQ awarded to quotation #${quotationId}`,
        tx,
      );
    });

    // Awarding an approved quotation completes the procurement transition and
    // creates the immutable purchase-order snapshot through the PO service.
    await purchaseOrderService.createFromQuotation(user, { quotationId });

    await notificationService.notify(
      quotation.vendorId,
      "RFQ_AWARDED",
      `Congratulations! RFQ ${rfq.rfqNumber} awarded`,
      `Your quotation was selected for ${rfq.rfqNumber}`,
      `/rfqs/${rfqId}`,
    );

    return this.getDetail(user, rfqId);
  }

  async getActivity(user: SafeUser, rfqId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.organizationId !== user.organizationId) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    return rfqRepository.findActivities(rfqId, user.organizationId);
  }

  async runDeadlineProcessing() {
    return processDueRfqs();
  }

  async notifyUpcomingDeadlines() {
    const now = new Date();
    const withinMs = 24 * 60 * 60 * 1000;
    const upcoming = await rfqRepository.findApproachingDeadlineRfqs(
      now,
      withinMs,
    );
    let sent = 0;

    for (const rfq of upcoming as any[]) {
      const link = `/rfqs/${rfq.id}`;
      for (const vendor of rfq.vendors ?? []) {
        const existing = await notificationRepository.findExisting(
          vendor.vendorId,
          rfq.organizationId,
          "RFQ_DEADLINE_APPROACHING",
          link,
        );
        if (!existing) {
          await notificationService.notify(
            vendor.vendorId,
            "RFQ_DEADLINE_APPROACHING",
            `Deadline approaching for ${rfq.rfqNumber}`,
            `Quotations close ${rfq.quotationDeadline?.toISOString()}`,
            link,
          );
          sent += 1;
        }
      }
    }

    return { processedRfqs: upcoming.length, notificationsSent: sent };
  }
}

export const rfqService = new RfqService();

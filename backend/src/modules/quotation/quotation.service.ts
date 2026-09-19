import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error";
import { SafeUser } from "../../shared/types/index.js";
import { quotationRepository } from "./quotation.repository";
import { rfqRepository } from "../rfq/rfq.repository";
import {
  assertQuotationSubmissionAllowed,
  resolveRfqDeadlineState,
} from "../rfq/rfq.state-helpers";
import { approvalRepository } from "../approval/approval.repository";
import { notificationService } from "../notification/notification.service";
import { QuotationQuery, QuotationSubmitInput, QuotationUpdateInput } from "./quotation.schema";

function computeMoney(input: QuotationSubmitInput["items"]) {
  return input.map((item) => {
    const unitPrice = new Prisma.Decimal(item.unitPrice);
    const quantity = new Prisma.Decimal(item.quantity);
    const subtotal = unitPrice.mul(quantity);
    const tax = new Prisma.Decimal(item.tax ?? 0);
    return { ...item, unitPrice, subtotal, tax };
  });
}

function sumSubtotal(items: Array<{ subtotal: Prisma.Decimal }>): Prisma.Decimal {
  return items.reduce((acc, item) => acc.add(item.subtotal), new Prisma.Decimal(0));
}

function sumTax(items: Array<{ tax: Prisma.Decimal }>): Prisma.Decimal {
  return items.reduce((acc, item) => acc.add(item.tax), new Prisma.Decimal(0));
}

function serializeQuotation(q: any, viewerRole: string) {
  return {
    id: q.id,
    quotationNumber: q.quotationNumber,
    rfq: q.rfq
      ? {
          id: q.rfq.id,
          rfqNumber: q.rfq.rfqNumber,
          title: q.rfq.title,
          status: q.rfq.status,
          quotationDeadline: q.rfq.quotationDeadline,
          requestedBy: q.rfq.requestedBy,
          items: q.rfq.items,
        }
      : undefined,
    rfqId: q.rfqId,
    vendorId: q.vendorId,
    status: q.status,
    subtotal: q.subtotal?.toString() ?? null,
    tax: q.tax?.toString() ?? "0",
    totalAmount: q.totalAmount?.toString() ?? null,
    currency: q.currency,
    paymentTerms: q.paymentTerms,
    deliveryDays: q.deliveryDays,
    deliveryDate: q.deliveryDate,
    validityDays: q.validityDays,
    notes: q.notes,
    items: (q.items ?? []).map((item: any) => ({
      id: item.id,
      rfqItemId: item.rfqItemId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice?.toString() ?? null,
      tax: item.tax?.toString() ?? "0",
      subtotal: item.subtotal?.toString() ?? null,
      notes: item.notes,
    })),
    vendor: q.vendor
      ? {
          id: q.vendor.id,
          name: q.vendor.name,
          email: q.vendor.email,
          profile: q.vendor.profile ?? null,
        }
      : undefined,
    submittedAt: q.submittedAt,
    updatedAt: q.updatedAt,
    approval: q.approval
      ? {
          id: q.approval.id,
          status: q.approval.status,
          requestedAt: q.approval.requestedAt,
          decidedAt: q.approval.decidedAt,
          comment: q.approval.comment,
        }
      : null,
    purchaseOrder: q.purchaseOrder ?? null,
  };
}

export class QuotationService {
  async submit(user: SafeUser, input: QuotationSubmitInput) {
    const rfq = await rfqRepository.findUniqueById(input.rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }

    const invitation = await rfqRepository.findInvitation(rfq.id, user.id);
    if (!invitation) {
      throw AppError.forbidden("You are not invited to this RFQ", "NOT_INVITED");
    }
    if (invitation.status === "DECLINED") {
      throw AppError.conflict("You have declined this invitation and cannot submit a quotation", "INVITATION_DECLINED");
    }

    const resolved = await resolveRfqDeadlineState(rfq);
    await assertQuotationSubmissionAllowed(resolved.rfq);

    const existing = await quotationRepository.findByRfqAndVendor(rfq.id, user.id);
    if (existing) {
      if (existing.status === "DRAFT") {
        return this.update(user, existing.id, {
          ...input,
          isDraft: input.isDraft,
        });
      }
      throw AppError.conflict(
        "A quotation has already been submitted for this RFQ",
        "QUOTATION_ALREADY_SUBMITTED"
      );
    }

    const rfqItemMap = new Map(rfq.items.map((i) => [i.id, i]));
    for (const item of input.items) {
      if (item.rfqItemId && !rfqItemMap.has(item.rfqItemId)) {
        throw AppError.badRequest(
          `RFQ item ${item.rfqItemId} does not belong to this RFQ`,
          "INVALID_RFQ_ITEM"
        );
      }
    }

    const computedItems = computeMoney(input.items);
    const subtotal = sumSubtotal(computedItems);
    const tax = sumTax(computedItems);
    const totalAmount = subtotal.add(tax);
    const quotationNumber = await quotationRepository.generateQuotationNumber();
    const status = input.isDraft ? "DRAFT" : "SUBMITTED";

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await quotationRepository.create(
        {
          quotationNumber,
          rfqId: rfq.id,
          vendorId: user.id,
          status,
          subtotal,
          tax,
          totalAmount,
          currency: input.currency ?? "INR",
          paymentTerms: input.paymentTerms,
          deliveryDays: input.deliveryDays,
          deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
          validityDays: input.validityDays,
          notes: input.notes,
          items: computedItems,
        },
        tx
      );

      if (!input.isDraft) {
        await rfqRepository.updateInvitation(
          rfq.id,
          user.id,
          { status: "QUOTATION_SUBMITTED", respondedAt: new Date() },
          tx
        );
        await rfqRepository.createActivity(
          rfq.id,
          user.id,
          "QUOTATION_SUBMITTED",
          `Quotation ${quotationNumber} submitted by ${user.name} for total ${totalAmount.toString()} ${input.currency ?? "INR"}`,
          tx
        );
      }

      return created;
    });

    if (!input.isDraft) {
      await notificationService.notify(
        rfq.requestedById,
        "QUOTATION_SUBMITTED",
        "New quotation received",
        `Vendor ${user.name} submitted quotation ${quotationNumber} totalling ${totalAmount.toString()} for ${rfq.rfqNumber}`,
        `/rfqs/${rfq.id}`
      );
    }

    return this.get(user, quotation.id);
  }

  async update(user: SafeUser, id: number, input: QuotationUpdateInput) {
    const quotation = await quotationRepository.findById(id);
    if (!quotation) {
      throw AppError.notFound("Quotation not found", "QUOTATION_NOT_FOUND");
    }

    if (quotation.vendorId !== user.id) {
      throw AppError.forbidden("You cannot modify another vendor's quotation", "FORBIDDEN");
    }

    // Terminal statuses forbid editing
    if (
      quotation.status === "SHORTLISTED" ||
      quotation.status === "AWAITING_APPROVAL" ||
      quotation.status === "APPROVED" ||
      quotation.status === "REJECTED" ||
      quotation.status === "AWARDED" ||
      quotation.status === "REVOKED" ||
      quotation.status === "WITHDRAWN"
    ) {
      throw AppError.conflict(
        `Quotation is in ${quotation.status} state and cannot be modified`,
        "QUOTATION_IMMUTABLE"
      );
    }

    const rfq = await rfqRepository.findUniqueById(quotation.rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }

    const resolved = await resolveRfqDeadlineState(rfq);
    await assertQuotationSubmissionAllowed(resolved.rfq);

    let subtotal: Prisma.Decimal | undefined;
    let tax: Prisma.Decimal | undefined;
    let totalAmount: Prisma.Decimal | undefined;
    let computedItems: any;

    if (input.items && input.items.length > 0) {
      const rfqItemMap = new Map(rfq.items.map((i) => [i.id, i]));
      for (const item of input.items) {
        if (item.rfqItemId && !rfqItemMap.has(item.rfqItemId)) {
          throw AppError.badRequest(
            `RFQ item ${item.rfqItemId} does not belong to this RFQ`,
            "INVALID_RFQ_ITEM"
          );
        }
      }
      computedItems = computeMoney(input.items);
      subtotal = sumSubtotal(computedItems);
      tax = sumTax(computedItems);
      totalAmount = subtotal.add(tax);
    }

    const shouldSubmit = input.isDraft === false && quotation.status === "DRAFT";
    const newStatus = shouldSubmit ? "SUBMITTED" : undefined;

    await prisma.$transaction(async (tx) => {
      await quotationRepository.update(
        id,
        {
          status: newStatus,
          subtotal,
          tax,
          totalAmount,
          currency: input.currency,
          paymentTerms: input.paymentTerms,
          deliveryDays: input.deliveryDays,
          deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
          validityDays: input.validityDays,
          notes: input.notes,
          items: computedItems,
        },
        tx
      );

      if (shouldSubmit) {
        await rfqRepository.updateInvitation(
          rfq.id,
          user.id,
          { status: "QUOTATION_SUBMITTED", respondedAt: new Date() },
          tx
        );
        await rfqRepository.createActivity(
          rfq.id,
          user.id,
          "QUOTATION_SUBMITTED",
          `Draft quotation #${id} submitted by ${user.name}`,
          tx
        );
      } else {
        await rfqRepository.createActivity(
          rfq.id,
          user.id,
          "QUOTATION_UPDATED",
          `Quotation #${id} updated by ${user.name}`,
          tx
        );
      }
    });

    if (shouldSubmit) {
      await notificationService.notify(
        rfq.requestedById,
        "QUOTATION_SUBMITTED",
        "Quotation submitted",
        `Vendor ${user.name} submitted quotation for ${rfq.rfqNumber}`,
        `/rfqs/${rfq.id}`
      );
    }

    return this.get(user, id);
  }

  async submitDraft(user: SafeUser, id: number) {
    return this.update(user, id, { isDraft: false });
  }

  async list(user: SafeUser, query: QuotationQuery) {
    const { page, limit, rfqId, vendorId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === "VENDOR") {
      where.vendorId = user.id;
      if (rfqId) {
        where.rfqId = rfqId;
      }
    } else {
      if (rfqId) where.rfqId = rfqId;
      if (vendorId) where.vendorId = vendorId;
    }

    if (status) where.status = status;

    const [data, total] = await Promise.all([
      quotationRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
      }),
      quotationRepository.count(where),
    ]);

    return {
      data: data.map((q: any) => serializeQuotation(q, user.role)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(user: SafeUser, id: number) {
    const quotation = await quotationRepository.findById(id);
    if (!quotation) {
      throw AppError.notFound("Quotation not found", "QUOTATION_NOT_FOUND");
    }
    if (user.role === "VENDOR" && quotation.vendorId !== user.id) {
      throw AppError.forbidden("You are not authorized to view this quotation", "FORBIDDEN");
    }
    return serializeQuotation(quotation, user.role);
  }

  async compare(user: SafeUser, rfqId: number) {
    if (user.role === "VENDOR") {
      throw AppError.forbidden("Vendors cannot view quotation comparisons", "FORBIDDEN");
    }

    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.status === "DRAFT") {
      throw AppError.forbidden("Draft RFQs cannot be compared", "RFQ_IS_DRAFT");
    }

    const quotations = await quotationRepository.findMany({
      where: {
        rfqId,
        status: { notIn: ["DRAFT", "WITHDRAWN"] },
      },
      orderBy: { totalAmount: "asc" },
    });

    const serializedQuotes = quotations.map((q) => serializeQuotation(q, user.role));

    let lowestTotalQuoteId: number | null = null;
    let lowestTotalAmount: string | null = null;
    let fastestDeliveryQuoteId: number | null = null;
    let fastestDeliveryDays: number | null = null;

    if (quotations.length > 0) {
      const sortedByTotal = [...quotations].sort((a, b) =>
        a.totalAmount.comparedTo(b.totalAmount)
      );
      lowestTotalQuoteId = sortedByTotal[0].id;
      lowestTotalAmount = sortedByTotal[0].totalAmount.toString();

      const withDelivery = quotations.filter((q) => q.deliveryDays !== null && q.deliveryDays !== undefined);
      if (withDelivery.length > 0) {
        const sortedByDelivery = [...withDelivery].sort((a, b) => (a.deliveryDays! - b.deliveryDays!));
        fastestDeliveryQuoteId = sortedByDelivery[0].id;
        fastestDeliveryDays = sortedByDelivery[0].deliveryDays;
      }
    }

    // Find lowest unit price per RFQ item
    const itemComparisons = rfq.items.map((rfqItem) => {
      let lowestUnitPrice: number | null = null;
      let lowestUnitVendorId: number | null = null;
      let lowestQuoteId: number | null = null;

      for (const q of quotations) {
        const matchingItem = q.items.find((qi: any) => qi.rfqItemId === rfqItem.id || qi.name === rfqItem.name);
        if (matchingItem) {
          const priceNum = matchingItem.unitPrice.toNumber();
          if (lowestUnitPrice === null || priceNum < lowestUnitPrice) {
            lowestUnitPrice = priceNum;
            lowestUnitVendorId = q.vendorId;
            lowestQuoteId = q.id;
          }
        }
      }

      return {
        rfqItemId: rfqItem.id,
        name: rfqItem.name,
        quantity: rfqItem.quantity,
        unit: rfqItem.unit,
        lowestUnitPrice,
        lowestUnitVendorId,
        lowestQuoteId,
      };
    });

    return {
      rfq: {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        title: rfq.title,
        status: rfq.status,
        quotationDeadline: rfq.quotationDeadline,
        expectedDeliveryDate: rfq.expectedDeliveryDate,
        items: rfq.items,
      },
      quotations: serializedQuotes,
      summary: {
        totalQuotations: quotations.length,
        lowestTotalAmount,
        lowestTotalQuoteId,
        fastestDeliveryDays,
        fastestDeliveryQuoteId,
        itemComparisons,
      },
    };
  }

  async shortlist(user: SafeUser, rfqId: number, quotationId: number) {
    const rfq = await rfqRepository.findUniqueById(rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.status === "CANCELLED" || rfq.status === "EXPIRED" || rfq.status === "AWARDED") {
      throw AppError.conflict(`RFQ is ${rfq.status}; it can no longer be shortlisted`, "INVALID_RFQ_STATE");
    }
    if (rfq.status === "DRAFT") {
      throw AppError.conflict("RFQ must accept quotations before a winner can be selected", "INVALID_RFQ_STATE");
    }
    if (rfq.status === "PUBLISHED" || rfq.status === "OPEN") {
      const resolved = await resolveRfqDeadlineState(rfq);
      if (resolved.rfq && (resolved.rfq.status === "PUBLISHED" || resolved.rfq.status === "OPEN")) {
        throw AppError.conflict("Quote deadline has not passed yet", "RFQ_DEADLINE_NOT_REACHED");
      }
    }

    const quotation = await quotationRepository.findById(quotationId);
    if (!quotation || quotation.rfqId !== rfqId) {
      throw AppError.notFound("Quotation not found for this RFQ", "QUOTATION_NOT_FOUND");
    }
    if (quotation.status !== "SUBMITTED") {
      throw AppError.conflict("This quotation can no longer be shortlisted", "INVALID_QUOTATION_STATE");
    }

    const existingApproval = await approvalRepository.findByRfq(rfqId);
    if (existingApproval && existingApproval.status === "PENDING") {
      throw AppError.conflict("An approval request is already pending for this RFQ", "APPROVAL_ALREADY_PENDING");
    }

    const managers = await rfqRepository.findManagers();

    await prisma.$transaction(async (tx) => {
      await quotationRepository.updateStatus(quotationId, "SHORTLISTED", tx);
      await rfqRepository.update(rfqId, { status: "SHORTLISTED" }, tx);
      await approvalRepository.create(
        { rfqId, quotationId, requestedById: user.id },
        tx
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "QUOTATION_SHORTLISTED",
        `Quotation #${quotationId} from ${quotation.vendor?.name ?? "vendor"} shortlisted`,
        tx
      );
      await rfqRepository.createActivity(
        rfqId,
        user.id,
        "APPROVAL_REQUESTED",
        `Approval requested for quotation #${quotationId}`,
        tx
      );
    });

    await notificationService.notifyMany(
      managers.map((m) => m.id),
      "APPROVAL_REQUESTED",
      "Approval required",
      `${rfq.rfqNumber} quotation ${quotation.vendor?.name ?? "vendor"} requires manager approval`,
      `/rfqs/${rfqId}`
    );
    await notificationService.notify(
      quotation.vendorId,
      "QUOTATION_SHORTLISTED",
      "Your quotation was shortlisted",
      `Your quotation for ${rfq.rfqNumber} was shortlisted`,
      `/rfqs/${rfqId}`
    );

    return this.get(user, quotationId);
  }
}

export const quotationService = new QuotationService();
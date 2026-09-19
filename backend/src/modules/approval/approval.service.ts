import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { SafeUser } from "../../shared/types/index.js";
import { approvalRepository } from "./approval.repository";
import { quotationRepository } from "../quotation/quotation.repository";
import { rfqRepository } from "../rfq/rfq.repository";
import { notificationService } from "../notification/notification.service";
import {
  ApprovalQuery,
  ApprovalDecisionInput,
  CreateApprovalInput,
} from "./approval.schema";

export class ApprovalService {
  async list(user: SafeUser, query: ApprovalQuery) {
    const { page, limit, rfqId, status } = query;
    const skip = (page - 1) * limit;
    const where: any = { organizationId: user.organizationId };

    if (rfqId) where.rfqId = rfqId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      approvalRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: "desc" },
      }),
      approvalRepository.count(where),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async get(user: SafeUser, id: number) {
    const approval = await approvalRepository.findById(id);
    if (!approval) {
      throw AppError.notFound(
        "Approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }
    if (approval.organizationId !== user.organizationId) {
      throw AppError.notFound(
        "Approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }
    return approval;
  }

  async create(user: SafeUser, input: CreateApprovalInput) {
    const rfq = await rfqRepository.findUniqueById(input.rfqId);
    if (!rfq) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }
    if (rfq.organizationId !== user.organizationId) {
      throw AppError.notFound("RFQ not found", "RFQ_NOT_FOUND");
    }

    const quotation = await quotationRepository.findById(input.quotationId);
    if (!quotation || quotation.rfqId !== input.rfqId) {
      throw AppError.notFound(
        "Quotation not found for this RFQ",
        "QUOTATION_NOT_FOUND",
      );
    }

    const existingApproval = await approvalRepository.findByRfq(input.rfqId);
    if (existingApproval && existingApproval.status === "PENDING") {
      throw AppError.conflict(
        "An approval request is already pending for this RFQ",
        "APPROVAL_ALREADY_PENDING",
      );
    }

    const managers = await rfqRepository.findManagers(user.organizationId);

    const created = await prisma.$transaction(async (tx) => {
      await quotationRepository.updateStatus(
        input.quotationId,
        "SHORTLISTED",
        tx,
      );
      await rfqRepository.update(
        input.rfqId,
        { status: "AWAITING_APPROVAL" },
        tx,
      );
      const appReq = await approvalRepository.create(
        {
          rfqId: input.rfqId,
          quotationId: input.quotationId,
          requestedById: user.id,
        },
        tx,
      );
      await rfqRepository.createActivity(
        input.rfqId,
        user.id,
        "APPROVAL_REQUESTED",
        `Approval requested for quotation #${input.quotationId}${input.comment ? ` (${input.comment})` : ""}`,
        tx,
      );
      return appReq;
    });

    await notificationService.notifyMany(
      managers.map((m) => m.id),
      "APPROVAL_REQUESTED",
      "Approval required",
      `${rfq.rfqNumber} quotation requires manager review and approval`,
      `/approvals/${created.id}`,
    );

    return this.get(user, created.id);
  }

  async approve(user: SafeUser, id: number, input: ApprovalDecisionInput) {
    const approval = await approvalRepository.findById(id);
    if (!approval) {
      throw AppError.notFound(
        "Approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }
    if (approval.organizationId !== user.organizationId) {
      throw AppError.notFound(
        "Approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }
    if (approval.status !== "PENDING") {
      throw AppError.conflict(
        `Approval request is already ${approval.status.toLowerCase()}`,
        "APPROVAL_ALREADY_DECIDED",
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await approvalRepository.updateStatus(
        id,
        {
          status: "APPROVED",
          approvedById: user.id,
          decidedAt: now,
          comment: input.comment,
        },
        tx,
      );
      await quotationRepository.updateStatus(
        approval.quotationId,
        "APPROVED",
        tx,
      );
      await rfqRepository.createActivity(
        approval.rfqId,
        user.id,
        "APPROVAL_DECISION",
        `Quotation #${approval.quotationId} approved by ${user.name}${input.comment ? `: ${input.comment}` : ""}`,
        tx,
      );
    });

    await notificationService.notify(
      approval.requestedById,
      "APPROVAL_DECISION",
      "Quotation approved",
      `Quotation #${approval.quotationId} for ${approval.rfq.rfqNumber} was approved`,
      `/rfqs/${approval.rfqId}`,
    );

    return approvalRepository.findById(id);
  }

  async reject(user: SafeUser, id: number, input: ApprovalDecisionInput) {
    if (!input.comment || !input.comment.trim()) {
      throw AppError.badRequest(
        "Rejection remarks are required",
        "REMARKS_REQUIRED",
      );
    }

    const approval = await approvalRepository.findById(id);
    if (!approval) {
      throw AppError.notFound(
        "Approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }
    if (approval.organizationId !== user.organizationId) {
      throw AppError.notFound(
        "Approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }
    if (approval.status !== "PENDING") {
      throw AppError.conflict(
        `Approval request is already ${approval.status.toLowerCase()}`,
        "APPROVAL_ALREADY_DECIDED",
      );
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await approvalRepository.updateStatus(
        id,
        {
          status: "REJECTED",
          approvedById: user.id,
          decidedAt: now,
          comment: input.comment,
        },
        tx,
      );
      await quotationRepository.updateStatus(
        approval.quotationId,
        "REJECTED",
        tx,
      );
      await rfqRepository.update(
        approval.rfqId,
        { status: "UNDER_REVIEW" },
        tx,
      );
      await rfqRepository.createActivity(
        approval.rfqId,
        user.id,
        "QUOTATION_REJECTED",
        `Quotation #${approval.quotationId} was rejected during approval by ${user.name}: ${input.comment}`,
        tx,
      );
      await rfqRepository.createActivity(
        approval.rfqId,
        user.id,
        "APPROVAL_DECISION",
        `Approval for quotation #${approval.quotationId} rejected by ${user.name}: ${input.comment}`,
        tx,
      );
    });

    await notificationService.notify(
      approval.requestedById,
      "APPROVAL_DECISION",
      "Quotation rejected",
      `Quotation #${approval.quotationId} for ${approval.rfq.rfqNumber} was rejected: ${input.comment}`,
      `/rfqs/${approval.rfqId}`,
    );

    return approvalRepository.findById(id);
  }
}

export const approvalService = new ApprovalService();

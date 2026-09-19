import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { safeUserSelect } from "../rfq/rfq.repository";

type Tx = Prisma.TransactionClient;

export class ApprovalRepository {
  async create(data: { rfqId: number; quotationId: number; requestedById: number }, tx?: Tx) {
    const client = tx ?? prisma;
    return client.approvalRequest.create({
      data: {
        rfqId: data.rfqId,
        quotationId: data.quotationId,
        requestedById: data.requestedById,
      },
    });
  }

  async findById(id: number) {
    return prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        rfq: { select: { id: true, rfqNumber: true, title: true, status: true } },
        quotation: {
          include: {
            vendor: { select: safeUserSelect },
            items: true,
          },
        },
        requestedBy: { select: safeUserSelect },
        approvedBy: { select: safeUserSelect },
      },
    });
  }

  async findByRfq(rfqId: number) {
    return prisma.approvalRequest.findFirst({
      where: { rfqId },
      orderBy: { requestedAt: "desc" },
    });
  }

  async findMany(options: {
    where: Prisma.ApprovalRequestWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.ApprovalRequestOrderByWithRelationInput;
  }) {
    return prisma.approvalRequest.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: {
        rfq: { select: { id: true, rfqNumber: true, title: true, status: true } },
        quotation: {
          include: {
            vendor: { select: safeUserSelect },
          },
        },
        requestedBy: { select: safeUserSelect },
        approvedBy: { select: safeUserSelect },
      },
    });
  }

  async count(where: Prisma.ApprovalRequestWhereInput): Promise<number> {
    return prisma.approvalRequest.count({ where });
  }

  async updateStatus(
    id: number,
    data: {
      status: "PENDING" | "APPROVED" | "REJECTED";
      approvedById?: number;
      decidedAt?: Date;
      comment?: string | null;
    },
    tx?: Tx
  ) {
    const client = tx ?? prisma;
    return client.approvalRequest.update({
      where: { id },
      data: {
        status: data.status as any,
        approvedById: data.approvedById,
        decidedAt: data.decidedAt,
        comment: data.comment,
      },
    });
  }
}

export const approvalRepository = new ApprovalRepository();
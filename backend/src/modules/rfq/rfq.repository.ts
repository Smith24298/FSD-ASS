import { randomBytes } from "node:crypto";
import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import {
  ActivityEvent,
  RFQInvitationStatus,
  RFQStatus,
} from "../../../generated/prisma/enums.js";
import { RFQ_NUMBER_PREFIX } from "./rfq.constants";
import { SafeUser } from "../../shared/types/index.js";

export const safeUserSelect = {
  id: true,
  email: true,
  userName: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type Tx = Prisma.TransactionClient;

export class RfqRepository {
  private delegate(tx?: Tx) {
    return tx ?? prisma;
  }

  async generateRfqNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const suffix = randomBytes(3).toString("hex").toUpperCase();
      const rfqNumber = `${RFQ_NUMBER_PREFIX}-${date}-${suffix}`;
      const existing = await prisma.rFQ.findUnique({
        where: { rfqNumber },
        select: { id: true },
      });
      if (!existing) {
        return rfqNumber;
      }
    }
    throw new Error("UNABLE_TO_GENERATE_RFQ_NUMBER");
  }

  async create(data: {
    rfqNumber: string;
    title: string;
    description?: string;
    priority: string;
    quotationDeadline?: Date;
    expectedDeliveryDate?: Date;
    requestedById: number;
    items: Array<{
      productId?: number;
      name: string;
      description?: string;
      quantity: number;
      unit?: string;
      technicalRequirements?: string;
      expectedDeliveryDate?: Date;
    }>;
    vendorIds?: number[];
  }, tx?: Tx) {
    const client = this.delegate(tx);
    return client.rFQ.create({
      data: {
        rfqNumber: data.rfqNumber,
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        quotationDeadline: data.quotationDeadline,
        expectedDeliveryDate: data.expectedDeliveryDate,
        requestedById: data.requestedById,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            technicalRequirements: item.technicalRequirements,
            expectedDeliveryDate: item.expectedDeliveryDate,
          })),
        },
        vendors: data.vendorIds?.length
          ? {
              create: data.vendorIds.map((vendorId) => ({ vendorId })),
            }
          : undefined,
      },
      include: {
        items: true,
        vendors: {
          include: { vendor: { select: safeUserSelect } },
        },
      },
    });
  }

  async findUniqueById(id: number) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: {
        requestedBy: { select: safeUserSelect },
        items: { orderBy: { id: "asc" } },
        vendors: {
          include: { vendor: { select: safeUserSelect } },
          orderBy: { invitedAt: "asc" },
        },
        attachments: {
          include: { uploadedBy: { select: safeUserSelect } },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: { user: { select: safeUserSelect } },
          orderBy: { createdAt: "desc" },
        },
        quotations: {
          include: {
            vendor: { select: safeUserSelect },
            items: true,
            approval: true,
          },
        },
        approvals: {
          include: {
            quotation: true,
            requestedBy: { select: safeUserSelect },
            approvedBy: { select: safeUserSelect },
          },
        },
      },
    });
  }

  async findMany(options: {
    where: Prisma.RFQWhereInput;
    skip: number;
    take: number;
    orderBy: Prisma.RFQOrderByWithRelationInput;
  }) {
    return prisma.rFQ.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: {
        requestedBy: { select: safeUserSelect },
        _count: {
          select: { items: true, vendors: true, quotations: true },
        },
      },
    });
  }

  async count(where: Prisma.RFQWhereInput): Promise<number> {
    return prisma.rFQ.count({ where });
  }

  async update(
    id: number,
    data: Prisma.RFQUpdateInput | Prisma.RFQUncheckedUpdateInput,
    tx?: Tx
  ) {
    const client = this.delegate(tx);
    return client.rFQ.update({ where: { id }, data });
  }

  async updateWhere(
    where: Prisma.RFQWhereInput,
    data: Prisma.RFQUncheckedUpdateManyInput,
    tx?: Tx
  ) {
    const client = this.delegate(tx);
    return client.rFQ.updateMany({ where, data });
  }

  async findVendorUsersByIds(ids: number[]) {
    return prisma.user.findMany({
      where: {
        id: { in: ids },
        role: "VENDOR",
        isActive: true,
        profile: { isNot: null },
      },
      select: safeUserSelect,
    });
  }

  async findActiveVendorById(id: number): Promise<SafeUser | null> {
    return prisma.user.findFirst({
      where: { id, role: "VENDOR", isActive: true, profile: { isNot: null } },
      select: safeUserSelect,
    });
  }

  async createInvitation(rfqId: number, vendorId: number, tx?: Tx) {
    const client = this.delegate(tx);
    return client.rFQVendor.create({
      data: { rfqId, vendorId },
      include: { vendor: { select: safeUserSelect } },
    });
  }

  async findInvitation(rfqId: number, vendorId: number) {
    return prisma.rFQVendor.findUnique({
      where: {
        rfqId_vendorId: { rfqId, vendorId },
      },
    });
  }

  async updateInvitation(
    rfqId: number,
    vendorId: number,
    data: {
      status?: RFQInvitationStatus;
      viewedAt?: Date | null;
      respondedAt?: Date | null;
      declineReason?: string | null;
    },
    tx?: Tx
  ) {
    const client = this.delegate(tx);
    return client.rFQVendor.update({
      where: { rfqId_vendorId: { rfqId, vendorId } },
      data,
    });
  }

  async deleteInvitation(rfqId: number, vendorId: number, tx?: Tx) {
    const client = this.delegate(tx);
    return client.rFQVendor.delete({
      where: { rfqId_vendorId: { rfqId, vendorId } },
    });
  }

  async updateInvitationsForRfq(
    rfqId: number,
    data: { status?: RFQInvitationStatus },
    where?: Prisma.RFQVendorWhereInput,
    tx?: Tx
  ) {
    const client = this.delegate(tx);
    return client.rFQVendor.updateMany({
      where: { rfqId, ...where },
      data,
    });
  }

  async findActivities(rfqId: number) {
    return prisma.rFQActivity.findMany({
      where: { rfqId },
      include: { user: { select: safeUserSelect } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createActivity(
    rfqId: number,
    userId: number,
    event: ActivityEvent,
    details?: string,
    tx?: Tx
  ) {
    const client = this.delegate(tx);
    return client.rFQActivity.create({
      data: { rfqId, userId, event, details },
      include: { user: { select: safeUserSelect } },
    });
  }

  async createActivityMany(
    rfqId: number,
    userId: number,
    event: ActivityEvent,
    details: string[],
    tx?: Tx
  ) {
    const client = this.delegate(tx);
    return client.rFQActivity.createMany({
      data: details.map((detail) => ({ rfqId, userId, event, details: detail })),
    });
  }

  async createAttachment(data: {
    rfqId: number;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    uploadedById: number;
  }) {
    return prisma.rFQAttachment.create({
      data,
      include: { uploadedBy: { select: safeUserSelect } },
    });
  }

  async findAttachment(id: number) {
    return prisma.rFQAttachment.findUnique({ where: { id } });
  }

  async deleteAttachment(id: number) {
    return prisma.rFQAttachment.delete({ where: { id } });
  }

  async findManagers(): Promise<SafeUser[]> {
    return prisma.user.findMany({
      where: { role: "MANAGER", isActive: true },
      select: safeUserSelect,
    });
  }

  async findDueRfqs(now: Date) {
    return prisma.rFQ.findMany({
      where: {
        status: { in: ["PUBLISHED", "OPEN"] },
        quotationDeadline: { lte: now },
      },
      include: {
        vendors: true,
        quotations: { select: { id: true } },
      },
    });
  }

  async findApproachingDeadlineRfqs(now: Date, withinMs: number) {
    return prisma.rFQ.findMany({
      where: {
        status: { in: ["PUBLISHED", "OPEN"] },
        quotationDeadline: {
          gte: now,
          lte: new Date(now.getTime() + withinMs),
        },
      },
      include: {
        vendors: { select: { vendorId: true } },
      },
    });
  }
}

export const rfqRepository = new RfqRepository();
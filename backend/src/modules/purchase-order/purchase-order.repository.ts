import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { safeUserSelect } from "../rfq/rfq.repository";

type Tx = Prisma.TransactionClient;

export class PurchaseOrderRepository {
  async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    const nextSeq = count + 1;
    return `PO-${year}-${String(nextSeq).padStart(6, "0")}`;
  }

  async findById(id: number) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            ...safeUserSelect,
            profile: true,
          },
        },
        createdBy: { select: safeUserSelect },
        rfq: {
          select: {
            id: true,
            rfqNumber: true,
            title: true,
            status: true,
          },
        },
        quotation: {
          include: {
            approval: true,
          },
        },
        items: true,
        invoice: {
          include: {
            items: true,
          },
        },
      },
    });
  }

  async findByQuotationId(quotationId: number) {
    return prisma.purchaseOrder.findUnique({
      where: { quotationId },
    });
  }

  async create(
    data: {
      poNumber: string;
      quotationId: number;
      rfqId: number;
      vendorId: number;
      createdById: number;
      status?: any;
      expectedDeliveryDate?: Date | null;
      subtotal: Prisma.Decimal;
      tax: Prisma.Decimal;
      total: Prisma.Decimal;
      notes?: string | null;
      items: Array<{
        rfqItemId?: number | null;
        name: string;
        description?: string | null;
        quantity: number;
        unit?: string | null;
        unitPrice: Prisma.Decimal;
        tax: Prisma.Decimal;
        subtotal: Prisma.Decimal;
        total: Prisma.Decimal;
      }>;
    },
    tx?: Tx,
  ) {
    const client = tx ?? prisma;
    const rfq = await client.rFQ.findUnique({
      where: { id: data.rfqId },
      select: { organizationId: true },
    });
    if (!rfq) throw new Error("RFQ not found");
    return client.purchaseOrder.create({
      data: {
        poNumber: data.poNumber,
        quotationId: data.quotationId,
        rfqId: data.rfqId,
        vendorId: data.vendorId,
        createdById: data.createdById,
        organizationId: rfq.organizationId,
        status: data.status ?? "ISSUED",
        expectedDeliveryDate: data.expectedDeliveryDate,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            rfqItemId: item.rfqItemId ?? null,
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity,
            unit: item.unit ?? null,
            unitPrice: item.unitPrice,
            tax: item.tax,
            subtotal: item.subtotal,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
        vendor: { select: safeUserSelect },
        createdBy: { select: safeUserSelect },
        quotation: true,
        rfq: true,
      },
    });
  }

  async updateStatus(id: number, status: any, tx?: Tx) {
    const client = tx ?? prisma;
    return client.purchaseOrder.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async findMany(options: {
    where: Prisma.PurchaseOrderWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.PurchaseOrderOrderByWithRelationInput;
  }) {
    return prisma.purchaseOrder.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: {
        vendor: {
          select: {
            ...safeUserSelect,
            profile: true,
          },
        },
        createdBy: { select: safeUserSelect },
        rfq: { select: { id: true, rfqNumber: true, title: true } },
        quotation: { select: { id: true, quotationNumber: true } },
        items: true,
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    });
  }

  async count(where: Prisma.PurchaseOrderWhereInput): Promise<number> {
    return prisma.purchaseOrder.count({ where });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();

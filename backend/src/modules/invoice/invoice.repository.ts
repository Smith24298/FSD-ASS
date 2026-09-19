import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { safeUserSelect } from "../rfq/rfq.repository";

type Tx = Prisma.TransactionClient;

export class InvoiceRepository {
  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const nextSeq = count + 1;
    return `INV-${year}-${String(nextSeq).padStart(6, "0")}`;
  }

  async findById(id: number) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            ...safeUserSelect,
            profile: true,
          },
        },
        purchaseOrder: {
          include: {
            createdBy: { select: safeUserSelect },
            rfq: {
              select: {
                id: true,
                rfqNumber: true,
                title: true,
              },
            },
            quotation: {
              select: {
                id: true,
                quotationNumber: true,
                paymentTerms: true,
              },
            },
          },
        },
        items: true,
      },
    });
  }

  async findByPurchaseOrderId(purchaseOrderId: number) {
    return prisma.invoice.findUnique({
      where: { purchaseOrderId },
    });
  }

  async create(
    data: {
      invoiceNumber: string;
      purchaseOrderId: number;
      vendorId: number;
      status?: any;
      issueDate?: Date;
      dueDate?: Date | null;
      subtotal: Prisma.Decimal;
      tax: Prisma.Decimal;
      total: Prisma.Decimal;
      notes?: string | null;
      items: Array<{
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
    const po = await client.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      select: { organizationId: true },
    });
    if (!po) throw new Error("Purchase order not found");
    return client.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        purchaseOrderId: data.purchaseOrderId,
        vendorId: data.vendorId,
        organizationId: po.organizationId,
        status: data.status ?? "ISSUED",
        issueDate: data.issueDate ?? new Date(),
        dueDate: data.dueDate,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
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
        purchaseOrder: true,
      },
    });
  }

  async updateStatus(id: number, status: any, tx?: Tx) {
    const client = tx ?? prisma;
    return client.invoice.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async findMany(options: {
    where: Prisma.InvoiceWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput;
  }) {
    return prisma.invoice.findMany({
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
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            rfq: { select: { id: true, rfqNumber: true, title: true } },
          },
        },
        items: true,
      },
    });
  }

  async count(where: Prisma.InvoiceWhereInput): Promise<number> {
    return prisma.invoice.count({ where });
  }
}

export const invoiceRepository = new InvoiceRepository();

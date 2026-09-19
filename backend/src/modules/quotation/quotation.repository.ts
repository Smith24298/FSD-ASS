import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { safeUserSelect } from "../rfq/rfq.repository";

type Tx = Prisma.TransactionClient;

const vendorWithProfileSelect = {
  ...safeUserSelect,
  profile: {
    select: {
      companyName: true,
      gstNumber: true,
      vendorCode: true,
      category: true,
      rating: true,
      status: true,
      mobileNumber: true,
      address: true,
    },
  },
};

export class QuotationRepository {
  async generateQuotationNumber(): Promise<string> {
    const count = await prisma.quotation.count();
    const nextSeq = count + 1;
    return `QT-${new Date().getFullYear()}-${String(nextSeq).padStart(6, "0")}`;
  }

  async findById(id: number) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        rfq: {
          include: {
            requestedBy: { select: safeUserSelect },
            items: true,
          },
        },
        vendor: { select: vendorWithProfileSelect },
        items: { orderBy: { id: "asc" } },
        approval: {
          include: {
            requestedBy: { select: safeUserSelect },
            approvedBy: { select: safeUserSelect },
          },
        },
        purchaseOrder: true,
      },
    });
  }

  async findByRfqAndVendor(rfqId: number, vendorId: number) {
    return prisma.quotation.findUnique({
      where: { rfqId_vendorId: { rfqId, vendorId } },
      include: {
        items: true,
      },
    });
  }

  async create(
    data: {
      quotationNumber: string;
      rfqId: number;
      vendorId: number;
      status?: any;
      subtotal: Prisma.Decimal;
      tax: Prisma.Decimal;
      totalAmount: Prisma.Decimal;
      currency: string;
      paymentTerms?: string | null;
      deliveryDays?: number | null;
      deliveryDate?: Date | null;
      validityDays?: number | null;
      notes?: string | null;
      items: Array<{
        rfqItemId?: number | null;
        name: string;
        description?: string | null;
        quantity: number;
        unit?: string | null;
        unitPrice: Prisma.Decimal;
        tax?: Prisma.Decimal;
        subtotal: Prisma.Decimal;
        notes?: string | null;
      }>;
    },
    tx?: Tx
  ) {
    const client = tx ?? prisma;
    return client.quotation.create({
      data: {
        quotationNumber: data.quotationNumber,
        rfqId: data.rfqId,
        vendorId: data.vendorId,
        status: data.status ?? "SUBMITTED",
        subtotal: data.subtotal,
        tax: data.tax,
        totalAmount: data.totalAmount,
        currency: data.currency,
        paymentTerms: data.paymentTerms ?? null,
        deliveryDays: data.deliveryDays ?? null,
        deliveryDate: data.deliveryDate ?? null,
        validityDays: data.validityDays ?? null,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            rfqItemId: item.rfqItemId ?? null,
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity,
            unit: item.unit ?? null,
            unitPrice: item.unitPrice,
            tax: item.tax ?? new Prisma.Decimal(0),
            subtotal: item.subtotal,
            notes: item.notes ?? null,
          })),
        },
      },
      include: {
        vendor: { select: vendorWithProfileSelect },
        items: true,
        approval: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      status?: any;
      subtotal?: Prisma.Decimal;
      tax?: Prisma.Decimal;
      totalAmount?: Prisma.Decimal;
      currency?: string;
      paymentTerms?: string | null;
      deliveryDays?: number | null;
      deliveryDate?: Date | null;
      validityDays?: number | null;
      notes?: string | null;
      items?: Array<{
        rfqItemId?: number | null;
        name: string;
        description?: string | null;
        quantity: number;
        unit?: string | null;
        unitPrice: Prisma.Decimal;
        tax?: Prisma.Decimal;
        subtotal: Prisma.Decimal;
        notes?: string | null;
      }>;
    },
    tx?: Tx
  ) {
    const client = tx ?? prisma;
    return client.quotation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.subtotal !== undefined ? { subtotal: data.subtotal } : {}),
        ...(data.tax !== undefined ? { tax: data.tax } : {}),
        ...(data.totalAmount !== undefined ? { totalAmount: data.totalAmount } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
        ...(data.deliveryDays !== undefined ? { deliveryDays: data.deliveryDays } : {}),
        ...(data.deliveryDate !== undefined ? { deliveryDate: data.deliveryDate } : {}),
        ...(data.validityDays !== undefined ? { validityDays: data.validityDays } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        items: data.items
          ? {
              deleteMany: {},
              create: data.items.map((item) => ({
                rfqItemId: item.rfqItemId ?? null,
                name: item.name,
                description: item.description ?? null,
                quantity: item.quantity,
                unit: item.unit ?? null,
                unitPrice: item.unitPrice,
                tax: item.tax ?? new Prisma.Decimal(0),
                subtotal: item.subtotal,
                notes: item.notes ?? null,
              })),
            }
          : undefined,
      },
      include: {
        vendor: { select: vendorWithProfileSelect },
        items: true,
        approval: true,
      },
    });
  }

  async updateStatus(id: number, status: string, tx?: Tx) {
    const client = tx ?? prisma;
    return client.quotation.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async updateMany(
    where: Prisma.QuotationWhereInput,
    data: { status?: string },
    tx?: Tx
  ) {
    const client = tx ?? prisma;
    return client.quotation.updateMany({
      where,
      data: {
        status: data.status,
        updatedAt: new Date(),
      } as any,
    });
  }

  async count(where: Prisma.QuotationWhereInput): Promise<number> {
    return prisma.quotation.count({ where });
  }

  async findMany(options: {
    where: Prisma.QuotationWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.QuotationOrderByWithRelationInput;
  }) {
    return prisma.quotation.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
      include: {
        vendor: { select: vendorWithProfileSelect },
        rfq: { select: { id: true, rfqNumber: true, title: true, status: true, quotationDeadline: true } },
        items: { orderBy: { id: "asc" } },
        approval: true,
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
      },
    });
  }
}

export const quotationRepository = new QuotationRepository();
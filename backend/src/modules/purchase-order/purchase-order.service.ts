import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error";
import { SafeUser } from "../../shared/types/index.js";
import { purchaseOrderRepository } from "./purchase-order.repository";
import { quotationRepository } from "../quotation/quotation.repository";
import { rfqRepository } from "../rfq/rfq.repository";
import { notificationService } from "../notification/notification.service";
import {
  CreatePurchaseOrderInput,
  PurchaseOrderQuery,
  UpdatePoStatusInput,
} from "./purchase-order.schema";

export class PurchaseOrderService {
  async createFromQuotation(user: SafeUser, input: CreatePurchaseOrderInput) {
    const quotation = await quotationRepository.findById(input.quotationId);
    if (!quotation) {
      throw AppError.notFound("Quotation not found", "QUOTATION_NOT_FOUND");
    }

    if (quotation.status !== "APPROVED" && quotation.status !== "AWARDED") {
      throw AppError.conflict(
        `Cannot generate Purchase Order: Quotation status is ${quotation.status}. It must be APPROVED or AWARDED first.`,
        "QUOTATION_NOT_APPROVED"
      );
    }

    const existingPo = await purchaseOrderRepository.findByQuotationId(input.quotationId);
    if (existingPo) {
      throw AppError.conflict(
        `Purchase Order already generated for this quotation (${existingPo.poNumber})`,
        "PO_ALREADY_EXISTS"
      );
    }

    const poNumber = await purchaseOrderRepository.generatePoNumber();

    const poItems = quotation.items.map((item) => {
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const quantity = new Prisma.Decimal(item.quantity);
      const subtotal = unitPrice.mul(quantity);
      const tax = new Prisma.Decimal(item.tax ?? 0);
      const total = subtotal.add(tax);
      return {
        rfqItemId: item.rfqItemId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice,
        tax,
        subtotal,
        total,
      };
    });

    const subtotal = poItems.reduce((acc, i) => acc.add(i.subtotal), new Prisma.Decimal(0));
    const tax = poItems.reduce((acc, i) => acc.add(i.tax), new Prisma.Decimal(0));
    const total = subtotal.add(tax);

    const po = await prisma.$transaction(async (tx) => {
      const created = await purchaseOrderRepository.create(
        {
          poNumber,
          quotationId: quotation.id,
          rfqId: quotation.rfqId,
          vendorId: quotation.vendorId,
          createdById: user.id,
          status: "ISSUED",
          expectedDeliveryDate: input.expectedDeliveryDate
            ? new Date(input.expectedDeliveryDate)
            : quotation.deliveryDate ?? undefined,
          subtotal,
          tax,
          total,
          notes: input.notes ?? quotation.notes,
          items: poItems,
        },
        tx
      );

      await quotationRepository.updateStatus(quotation.id, "AWARDED", tx);
      await rfqRepository.update(quotation.rfqId, { status: "AWARDED" }, tx);

      await rfqRepository.createActivity(
        quotation.rfqId,
        user.id,
        "PO_CREATED",
        `Purchase Order ${poNumber} created from approved quotation #${quotation.id} for total ${total.toString()} ${quotation.currency}`,
        tx
      );

      await rfqRepository.createActivity(
        quotation.rfqId,
        user.id,
        "PO_ISSUED",
        `Purchase Order ${poNumber} issued to ${quotation.vendor?.name ?? "vendor"}`,
        tx
      );

      return created;
    });

    await notificationService.notify(
      quotation.vendorId,
      "PO_ISSUED",
      "Purchase Order Issued",
      `Purchase Order ${poNumber} has been issued for ${quotation.rfq?.rfqNumber ?? "RFQ"}. Total: ${total.toString()} ${quotation.currency}`,
      `/purchase-orders/${po.id}`
    );

    return purchaseOrderRepository.findById(po.id);
  }

  async list(user: SafeUser, query: PurchaseOrderQuery) {
    const { page, limit, search, status, vendorId, rfqId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === "VENDOR") {
      where.vendorId = user.id;
    } else if (vendorId) {
      where.vendorId = vendorId;
    }

    if (rfqId) where.rfqId = rfqId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { rfq: { rfqNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      purchaseOrderRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      purchaseOrderRepository.count(where),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(user: SafeUser, id: number) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po) {
      throw AppError.notFound("Purchase Order not found", "PO_NOT_FOUND");
    }

    if (user.role === "VENDOR" && po.vendorId !== user.id) {
      throw AppError.forbidden("You are not authorized to view this Purchase Order", "FORBIDDEN");
    }

    return po;
  }

  async updateStatus(user: SafeUser, id: number, input: UpdatePoStatusInput) {
    const po = await purchaseOrderRepository.findById(id);
    if (!po) {
      throw AppError.notFound("Purchase Order not found", "PO_NOT_FOUND");
    }

    if (user.role === "VENDOR") {
      if (po.vendorId !== user.id) {
        throw AppError.forbidden("You cannot modify another vendor's Purchase Order", "FORBIDDEN");
      }
      if (input.status !== "CONFIRMED") {
        throw AppError.forbidden("Vendors may only confirm Purchase Orders", "FORBIDDEN");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await purchaseOrderRepository.updateStatus(id, input.status, tx);
      const event = input.status === "CANCELLED" ? "PO_CANCELLED" : "PO_ISSUED";
      await rfqRepository.createActivity(
        po.rfqId,
        user.id,
        event as any,
        `Purchase Order ${po.poNumber} status updated to ${input.status}${input.notes ? `: ${input.notes}` : ""}`,
        tx
      );
      return result;
    });

    return purchaseOrderRepository.findById(id);
  }
}

export const purchaseOrderService = new PurchaseOrderService();

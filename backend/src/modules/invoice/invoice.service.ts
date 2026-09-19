import { prisma } from "../../infrastructure/database/prisma";
import { Prisma } from "../../../generated/prisma/client.js";
import { AppError } from "../../shared/errors/app-error";
import { SafeUser } from "../../shared/types/index.js";
import { invoiceRepository } from "./invoice.repository";
import { purchaseOrderRepository } from "../purchase-order/purchase-order.repository";
import { rfqRepository } from "../rfq/rfq.repository";
import { notificationService } from "../notification/notification.service";
import { generateInvoicePdfBuffer } from "./invoice-pdf.service";
import { emailService } from "./email.service";
import {
  CreateInvoiceInput,
  InvoiceQuery,
  SendEmailInput,
  UpdateInvoiceStatusInput,
} from "./invoice.schema";

export class InvoiceService {
  async createFromPurchaseOrder(user: SafeUser, input: CreateInvoiceInput) {
    const po = await purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!po) {
      throw AppError.notFound("Purchase Order not found", "PO_NOT_FOUND");
    }

    if (po.status === "CANCELLED" || po.status === "DRAFT") {
      throw AppError.conflict(
        `Cannot generate invoice for Purchase Order in status ${po.status}`,
        "PO_INVALID_STATUS"
      );
    }

    const existingInvoice = await invoiceRepository.findByPurchaseOrderId(po.id);
    if (existingInvoice) {
      throw AppError.conflict(
        `Invoice already generated for this Purchase Order (${existingInvoice.invoiceNumber})`,
        "INVOICE_ALREADY_EXISTS"
      );
    }

    const invoiceNumber = await invoiceRepository.generateInvoiceNumber();

    const invoiceItems = po.items.map((item) => {
      const unitPrice = new Prisma.Decimal(item.unitPrice);
      const quantity = new Prisma.Decimal(item.quantity);
      const subtotal = unitPrice.mul(quantity);
      const tax = new Prisma.Decimal(item.tax);
      const total = subtotal.add(tax);
      return {
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

    const subtotal = invoiceItems.reduce((acc, i) => acc.add(i.subtotal), new Prisma.Decimal(0));
    const tax = invoiceItems.reduce((acc, i) => acc.add(i.tax), new Prisma.Decimal(0));
    const total = subtotal.add(tax);

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await invoiceRepository.create(
        {
          invoiceNumber,
          purchaseOrderId: po.id,
          vendorId: po.vendorId,
          status: "ISSUED",
          issueDate: new Date(),
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          subtotal,
          tax,
          total,
          notes: input.notes ?? po.notes,
          items: invoiceItems,
        },
        tx
      );

      await rfqRepository.createActivity(
        po.rfqId,
        user.id,
        "INVOICE_CREATED",
        `Invoice ${invoiceNumber} generated for Purchase Order ${po.poNumber} for total ${total.toString()}`,
        tx
      );

      return created;
    });

    await notificationService.notify(
      po.vendorId,
      "INVOICE_GENERATED",
      "Invoice Generated",
      `Invoice ${invoiceNumber} has been generated for Purchase Order ${po.poNumber}. Total: ${total.toString()}`,
      `/invoices/${invoice.id}`
    );

    return invoiceRepository.findById(invoice.id);
  }

  async list(user: SafeUser, query: InvoiceQuery) {
    const { page, limit, search, status, vendorId, purchaseOrderId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === "VENDOR") {
      where.vendorId = user.id;
    } else if (vendorId) {
      where.vendorId = vendorId;
    }

    if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      invoiceRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      invoiceRepository.count(where),
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
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw AppError.notFound("Invoice not found", "INVOICE_NOT_FOUND");
    }

    if (user.role === "VENDOR" && invoice.vendorId !== user.id) {
      throw AppError.forbidden("You are not authorized to view this invoice", "FORBIDDEN");
    }

    return invoice;
  }

  async updateStatus(user: SafeUser, id: number, input: UpdateInvoiceStatusInput) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw AppError.notFound("Invoice not found", "INVOICE_NOT_FOUND");
    }

    if (user.role === "VENDOR") {
      throw AppError.forbidden("Vendors cannot modify invoice status", "FORBIDDEN");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await invoiceRepository.updateStatus(id, input.status, tx);
      const event = input.status === "PAID" ? "INVOICE_PAID" : "INVOICE_CREATED";
      await rfqRepository.createActivity(
        invoice.purchaseOrder.rfqId,
        user.id,
        event as any,
        `Invoice ${invoice.invoiceNumber} status updated to ${input.status}${input.notes ? `: ${input.notes}` : ""}`,
        tx
      );
      return result;
    });

    return invoiceRepository.findById(id);
  }

  async generatePdf(user: SafeUser, id: number) {
    const invoice = await this.getById(user, id);

    const pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      poNumber: invoice.purchaseOrder.poNumber,
      rfqNumber: invoice.purchaseOrder.rfq?.rfqNumber,
      vendor: {
        name: invoice.vendor.name,
        email: invoice.vendor.email,
        companyName: invoice.vendor.profile?.companyName,
        gstNumber: invoice.vendor.profile?.gstNumber,
        address: invoice.vendor.profile?.address,
        mobileNumber: invoice.vendor.profile?.mobileNumber,
      },
      items: invoice.items.map((i) => ({
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice.toString(),
        tax: i.tax.toString(),
        subtotal: i.subtotal.toString(),
        total: i.total.toString(),
      })),
      subtotal: invoice.subtotal.toString(),
      tax: invoice.tax.toString(),
      total: invoice.total.toString(),
      notes: invoice.notes,
    });

    return {
      buffer: pdfBuffer,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  }

  async sendEmail(user: SafeUser, id: number, input: SendEmailInput) {
    const invoice = await this.getById(user, id);

    const recipientEmail = input.recipientEmail || invoice.vendor.email;

    const { buffer } = await this.generatePdf(user, id);

    await emailService.sendInvoice({
      to: recipientEmail,
      invoiceNumber: invoice.invoiceNumber,
      poNumber: invoice.purchaseOrder.poNumber,
      total: invoice.total.toString(),
      pdfBuffer: buffer,
      customMessage: input.customMessage,
    });

    await rfqRepository.createActivity(
      invoice.purchaseOrder.rfqId,
      user.id,
      "INVOICE_SENT",
      `Invoice ${invoice.invoiceNumber} emailed to ${recipientEmail}`
    );

    await notificationService.notify(
      invoice.vendorId,
      "INVOICE_SENT",
      "Invoice Emailed",
      `Invoice ${invoice.invoiceNumber} was dispatched to ${recipientEmail}`,
      `/invoices/${invoice.id}`
    );

    return {
      success: true,
      message: `Invoice emailed to ${recipientEmail}`,
    };
  }
}

export const invoiceService = new InvoiceService();

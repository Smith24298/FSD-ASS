import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const invoiceStatusEnum = z.enum([
  "DRAFT",
  "ISSUED",
  "PAID",
  "CANCELLED",
  "OVERDUE",
]);

export const createInvoiceSchema = z.object({
  purchaseOrderId: positiveInt,
  dueDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: invoiceStatusEnum,
  notes: z.string().max(1000).optional(),
});

export const invoiceParamsSchema = z.object({
  id: positiveInt,
});

export const invoiceQuerySchema = z.object({
  page: positiveInt.default(1),
  limit: positiveInt.max(100).default(10),
  search: z.string().optional(),
  status: invoiceStatusEnum.optional(),
  vendorId: positiveInt.optional(),
  purchaseOrderId: positiveInt.optional(),
});

export const sendEmailSchema = z.object({
  recipientEmail: z.string().email().optional(),
  customMessage: z.string().max(2000).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceParams = z.infer<typeof invoiceParamsSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;

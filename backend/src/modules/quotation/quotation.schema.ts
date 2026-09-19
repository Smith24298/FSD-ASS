import { z } from "zod";
import { QUOTATION_STATUSES } from "../rfq/rfq.constants";

const positiveInt = z.coerce.number().int().positive();
const money = z.coerce
  .number()
  .positive("Unit price must be greater than 0");

export const quotationItemSchema = z.object({
  rfqItemId: positiveInt.optional(),
  name: z.string().min(1, "Item name is required").max(200),
  description: z.string().max(2000).optional(),
  quantity: positiveInt,
  unit: z.string().max(50).optional(),
  unitPrice: money,
  tax: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const submitQuotationSchema = z.object({
  rfqId: positiveInt,
  isDraft: z.boolean().optional(),
  items: z
    .array(quotationItemSchema)
    .min(1, "At least one quoted item is required")
    .max(500),
  currency: z.string().length(3).optional(),
  paymentTerms: z.string().max(500).optional(),
  deliveryDays: positiveInt.optional(),
  deliveryDate: z.string().datetime({ offset: true }).optional(),
  validityDays: positiveInt.optional(),
  notes: z.string().max(2000).optional(),
});

export const updateQuotationSchema = z.object({
  isDraft: z.boolean().optional(),
  items: z
    .array(quotationItemSchema)
    .min(1, "At least one quoted item is required")
    .max(500)
    .optional(),
  currency: z.string().length(3).optional(),
  paymentTerms: z.string().max(500).optional(),
  deliveryDays: positiveInt.optional(),
  deliveryDate: z.string().datetime({ offset: true }).optional(),
  validityDays: positiveInt.optional(),
  notes: z.string().max(2000).optional(),
});

export const quotationParamsSchema = z.object({
  id: positiveInt,
});

export const quotationQuerySchema = z.object({
  page: positiveInt.default(1),
  limit: positiveInt.max(100).default(10),
  rfqId: positiveInt.optional(),
  vendorId: positiveInt.optional(),
  status: z.enum(QUOTATION_STATUSES).optional(),
});

export type QuotationSubmitInput = z.infer<typeof submitQuotationSchema>;
export type QuotationUpdateInput = z.infer<typeof updateQuotationSchema>;
export type QuotationParams = z.infer<typeof quotationParamsSchema>;
export type QuotationQuery = z.infer<typeof quotationQuerySchema>;
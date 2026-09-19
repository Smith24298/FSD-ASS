import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const poStatusEnum = z.enum([
  "DRAFT",
  "ISSUED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const createPurchaseOrderSchema = z.object({
  quotationId: positiveInt,
  expectedDeliveryDate: z.string().datetime({ offset: true }).optional(),
  notes: z.string().max(2000).optional(),
});

export const updatePoStatusSchema = z.object({
  status: poStatusEnum,
  notes: z.string().max(1000).optional(),
});

export const poParamsSchema = z.object({
  id: positiveInt,
});

export const poQuerySchema = z.object({
  page: positiveInt.default(1),
  limit: positiveInt.max(100).default(10),
  search: z.string().optional(),
  status: poStatusEnum.optional(),
  vendorId: positiveInt.optional(),
  rfqId: positiveInt.optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePoStatusInput = z.infer<typeof updatePoStatusSchema>;
export type PurchaseOrderParams = z.infer<typeof poParamsSchema>;
export type PurchaseOrderQuery = z.infer<typeof poQuerySchema>;

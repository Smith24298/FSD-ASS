import { z } from "zod";
import {
  RFQ_INVITATION_STATUSES,
  RFQ_PRIORITIES,
  RFQ_SORT_FIELDS,
  RFQ_STATUSES,
} from "./rfq.constants";

const dateString = z.string().datetime({ offset: true });

export const rfqItemSchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  name: z.string().min(1, "Item name is required").max(200),
  description: z.string().max(2000).optional(),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  unit: z.string().max(50).optional(),
  technicalRequirements: z.string().max(5000).optional(),
  expectedDeliveryDate: dateString.optional(),
});

export const createRfqSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(RFQ_PRIORITIES).optional(),
  deadline: dateString.optional(),
  expectedDeliveryDate: dateString.optional(),
  items: z
    .array(rfqItemSchema)
    .min(1, "At least one item is required")
    .max(500),
  vendorIds: z
    .array(z.coerce.number().int().positive())
    .max(200)
    .optional(),
  publish: z.boolean().optional(),
});

export const updateRfqSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(5000).optional(),
  priority: z.enum(RFQ_PRIORITIES).optional(),
  deadline: dateString.optional(),
  expectedDeliveryDate: dateString.nullish(),
  items: z
    .array(rfqItemSchema)
    .min(1, "At least one item is required")
    .max(500)
    .optional(),
});

export const rfqParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const rfqQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().max(200).optional(),
  status: z.enum(RFQ_STATUSES).optional(),
  priority: z.enum(RFQ_PRIORITIES).optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  createdFrom: dateString.optional(),
  createdTo: dateString.optional(),
  deadlineFrom: dateString.optional(),
  deadlineTo: dateString.optional(),
  sortBy: z.enum(RFQ_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const cancelRfqSchema = z.object({
  reason: z.string().min(3, "Cancellation reason is required").max(1000),
});

export const addVendorParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  vendorId: z.coerce.number().int().positive(),
});

export const addVendorBodySchema = z.object({
  vendorId: z.coerce.number().int().positive(),
});

export const attachmentParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  attachmentId: z.coerce.number().int().positive(),
});

export const declineRfqSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const shortlistParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  quotationId: z.coerce.number().int().positive(),
});

export const awardRfqSchema = z.object({
  quotationId: z.coerce.number().int().positive(),
});

export type CreateRfqInput = z.infer<typeof createRfqSchema>;
export type UpdateRfqInput = z.infer<typeof updateRfqSchema>;
export type RfqParams = z.infer<typeof rfqParamsSchema>;
export type RfqQuery = z.infer<typeof rfqQuerySchema>;
export type CancelRfqInput = z.infer<typeof cancelRfqSchema>;
export type AddVendorParams = z.infer<typeof addVendorParamsSchema>;
export type AddVendorBody = z.infer<typeof addVendorBodySchema>;
export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;
export type DeclineRfqInput = z.infer<typeof declineRfqSchema>;
export type ShortlistParams = z.infer<typeof shortlistParamsSchema>;
export type AwardRfqInput = z.infer<typeof awardRfqSchema>;
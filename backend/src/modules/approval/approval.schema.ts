import { z } from "zod";
import { APPROVAL_STATUSES } from "../rfq/rfq.constants";

const positiveInt = z.coerce.number().int().positive();

export const createApprovalSchema = z.object({
  rfqId: positiveInt,
  quotationId: positiveInt,
  comment: z.string().max(1000).optional(),
});

export const approvalParamsSchema = z.object({
  id: positiveInt,
});

export const approvalQuerySchema = z.object({
  page: positiveInt.default(1),
  limit: positiveInt.max(100).default(10),
  rfqId: positiveInt.optional(),
  status: z.enum(APPROVAL_STATUSES).optional(),
});

export const approveDecisionSchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const rejectDecisionSchema = z.object({
  comment: z
    .string()
    .min(1, "Rejection remarks are required")
    .max(1000),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type ApprovalParams = z.infer<typeof approvalParamsSchema>;
export type ApprovalQuery = z.infer<typeof approvalQuerySchema>;
export type ApproveDecisionInput = z.infer<typeof approveDecisionSchema>;
export type RejectDecisionInput = z.infer<typeof rejectDecisionSchema>;
export type ApprovalDecisionInput = { comment?: string };
import { z } from "zod";
import { NotificationType } from "../../../generated/prisma/enums.js";

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  isRead: z.coerce.boolean().optional(),
  type: z
    .enum(Object.values(NotificationType) as [string, ...string[]])
    .optional(),
});

export const notificationParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationParams = z.infer<typeof notificationParamsSchema>;
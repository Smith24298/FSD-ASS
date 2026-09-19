import { FastifyInstance } from "fastify";
import {
  authenticateUser,
  validateParams,
  validateQuery,
} from "../../shared/middleware/auth.middleware";
import { notificationParamsSchema, notificationQuerySchema } from "./notification.schema";
import {
  listNotificationsController,
  unreadCountController,
  markNotificationReadController,
  markAllNotificationsReadController,
} from "./notification.controller";

export default async function notificationRoutes(app: FastifyInstance) {
  app.get("/notifications", {
    preHandler: [authenticateUser, validateQuery(notificationQuerySchema)],
    handler: listNotificationsController,
  });

  app.get("/notifications/unread-count", {
    preHandler: [authenticateUser],
    handler: unreadCountController,
  });

  app.patch("/notifications/:id/read", {
    preHandler: [
      authenticateUser,
      validateParams(notificationParamsSchema),
    ],
    handler: markNotificationReadController,
  });

  app.patch("/notifications/read-all", {
    preHandler: [authenticateUser],
    handler: markAllNotificationsReadController,
  });
}
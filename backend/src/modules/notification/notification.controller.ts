import { FastifyReply, FastifyRequest } from "fastify";
import { notificationService } from "./notification.service";
import { NotificationParams, NotificationQuery } from "./notification.schema";
import { getCurrentUser } from "../../shared/middleware/auth.middleware";

export const listNotificationsController = async (
  req: FastifyRequest<{ Querystring: NotificationQuery }>,
  reply: FastifyReply
) => {
  const userId = (req.user as any).userId;
  const result = await notificationService.list(userId, req.query);

  return reply.code(200).send({
    success: true,
    message: "Notifications retrieved successfully",
    ...result,
  });
};

export const unreadCountController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (req.user as any).userId;
  const count = await notificationService.unreadCount(
    userId,
    getCurrentUser(req).organizationId,
  );

  return reply.code(200).send({
    success: true,
    message: "Unread notification count retrieved successfully",
    data: { count },
  });
};

export const markNotificationReadController = async (
  req: FastifyRequest<{ Params: NotificationParams }>,
  reply: FastifyReply
) => {
  const userId = (req.user as any).userId;
  const notification = await notificationService.markRead(
    userId,
    getCurrentUser(req).organizationId,
    req.params.id,
  );

  if (!notification) {
    return reply.code(404).send({
      success: false,
      message: "Notification not found",
    });
  }

  return reply.code(200).send({
    success: true,
    message: "Notification marked as read",
    data: notification,
  });
};

export const markAllNotificationsReadController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const userId = (req.user as any).userId;
  const result = await notificationService.markAllRead(
    userId,
    getCurrentUser(req).organizationId,
  );

  return reply.code(200).send({
    success: true,
    message: "All notifications marked as read",
    data: { count: result.count },
  });
};
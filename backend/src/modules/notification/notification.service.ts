import { notificationRepository } from "./notification.repository";
import { PaginatedNotifications } from "./notification.types";
import { NotificationQuery } from "./notification.schema";

export class NotificationService {
  async notify(userId: number, type: string, title: string, message?: string, link?: string) {
    return notificationRepository.create({ userId, type, title, message, link });
  }

  async notifyMany(userIds: number[], type: string, title: string, message?: string, link?: string) {
    return Promise.all(
      userIds.map((userId) => notificationRepository.create({ userId, type, title, message, link }))
    );
  }

  async list(userId: number, query: NotificationQuery): Promise<PaginatedNotifications> {
    const { page, limit, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      notificationRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      notificationRepository.count(where),
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

  async markRead(userId: number, id: number) {
    const notification = await notificationRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      return null;
    }
    return notificationRepository.markRead(id);
  }

  async markAllRead(userId: number) {
    return notificationRepository.markAllRead(userId);
  }

  async unreadCount(userId: number): Promise<number> {
    return notificationRepository.unreadCount(userId);
  }
}

export const notificationService = new NotificationService();
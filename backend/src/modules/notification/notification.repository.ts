import { prisma } from "../../infrastructure/database/prisma";

export class NotificationRepository {
  async create(data: {
    userId: number;
    type: string;
    title: string;
    message?: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message ?? null,
        link: data.link ?? null,
      },
    });
  }

  async findExisting(userId: number, type: string, link: string) {
    return prisma.notification.findFirst({
      where: {
        userId,
        type: type as any,
        link,
      },
    });
  }

  async findMany(options: {
    where: any;
    skip?: number;
    take?: number;
    orderBy?: any;
  }) {
    return prisma.notification.findMany({
      where: options.where,
      skip: options.skip,
      take: options.take,
      orderBy: options.orderBy,
    });
  }

  async count(where: any): Promise<number> {
    return prisma.notification.count({ where });
  }

  async findById(id: number) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markRead(id: number) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async unreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

export const notificationRepository = new NotificationRepository();
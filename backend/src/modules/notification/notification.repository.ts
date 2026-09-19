import { prisma } from "../../infrastructure/database/prisma";

export class NotificationRepository {
  async create(data: {
    userId: number;
    type: string;
    title: string;
    message?: string;
    link?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { organizationId: true },
    });
    if (!user) {
      throw new Error("Notification recipient not found");
    }
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message ?? null,
        link: data.link ?? null,
        organizationId: user.organizationId,
      },
    });
  }

  async findExisting(
    userId: number,
    organizationId: number,
    type: string,
    link: string,
  ) {
    return prisma.notification.findFirst({
      where: {
        userId,
        organizationId,
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

  async findById(id: number, userId: number, organizationId: number) {
    return prisma.notification.findFirst({
      where: { id, userId, organizationId },
    });
  }

  async markRead(id: number, userId: number, organizationId: number) {
    return prisma.notification.update({
      where: { id, userId, organizationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: number, organizationId: number) {
    return prisma.notification.updateMany({
      where: { userId, organizationId, isRead: false },
      data: { isRead: true },
    });
  }

  async unreadCount(userId: number, organizationId: number): Promise<number> {
    return prisma.notification.count({
      where: { userId, organizationId, isRead: false },
    });
  }
}

export const notificationRepository = new NotificationRepository();

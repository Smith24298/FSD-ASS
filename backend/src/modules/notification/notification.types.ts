export { NotificationType } from "../../../generated/prisma/enums.js";

export interface NotificationResponse {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface PaginatedNotifications {
  data: NotificationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
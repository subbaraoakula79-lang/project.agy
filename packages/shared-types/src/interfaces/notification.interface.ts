import { DevicePlatform, NotificationChannel, NotificationStatus, NotificationType } from '../enums/notification.enum';

export interface RegisterDeviceTokenDto {
  token: string;
  platform?: DevicePlatform;
  appRole?: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  failureReason?: string | null;
  retryCount: number;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationDto[];
  total: number;
  unreadCount: number;
}

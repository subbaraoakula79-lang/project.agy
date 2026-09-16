import { Inject, Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  DevicePlatform,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  RegisterDeviceTokenDto,
} from '@yatra-seva/shared-types';
import {
  NOTIFICATION_PROVIDER,
  NotificationProvider,
} from './interfaces/notification-provider.interface';

export interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel?: NotificationChannel;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_PROVIDER) private readonly notificationProvider: NotificationProvider
  ) {}

  private get db(): any {
    return this.prisma as any;
  }

  /**
   * Creates a notification DB record and dispatches via provider.
   * Safe execution: Never throws exception to caller on provider failure.
   */
  async createAndSendNotification(params: SendNotificationParams) {
    const { userId, type, title, body, data, channel = NotificationChannel.PUSH } = params;

    // 1. Persist notification in DB (status PENDING)
    const notification = await this.db.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? (data as any) : undefined,
        channel,
        status: NotificationStatus.PENDING,
      },
    });

    // 2. Fetch active device tokens
    const activeTokens = await this.db.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    const tokenStrings = activeTokens.map((t: { token: string }) => t.token);

    // 3. Dispatch via provider
    try {
      const result = await this.notificationProvider.send({
        id: notification.id,
        userId,
        type,
        title,
        body,
        data,
        channel,
        deviceTokens: tokenStrings,
      });

      if (result.invalidTokens && result.invalidTokens.length > 0) {
        this.logger.log(`Deactivating ${result.invalidTokens.length} invalid device tokens for user ${userId}`);
        await this.db.deviceToken.updateMany({
          where: {
            userId,
            token: { in: result.invalidTokens },
          },
          data: { isActive: false },
        }).catch((err: any) => this.logger.error(`Failed to deactivate invalid tokens: ${err.message}`));
      }

      if (result.success) {
        return await this.db.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
      } else {
        return await this.db.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
            failureReason: result.failureReason || 'Provider dispatch failed',
          },
        });
      }
    } catch (err: any) {
      this.logger.error(`Notification provider exception for notification ${notification.id}: ${err.message}`);
      return await this.db.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          failureReason: err.message || 'Provider execution exception',
        },
      });
    }
  }

  /**
   * Registers or updates a device push token for a user.
   */
  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    const { token, platform = DevicePlatform.ANDROID, appRole = 'RIDER' } = dto;

    return await this.db.deviceToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      create: {
        userId,
        token,
        platform: platform as any,
        appRole,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        isActive: true,
        platform: platform as any,
        appRole,
        lastSeenAt: new Date(),
      },
    });
  }

  /**
   * Deactivates a device push token for a user.
   */
  async deactivateDeviceToken(userId: string, token: string) {
    const existing = await this.db.deviceToken.findFirst({
      where: { userId, token },
    });

    if (!existing) {
      return;
    }

    await this.db.deviceToken.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }

  /**
   * Fetches paginated notifications for a user with unread count.
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.db.notification.count({ where: { userId } }),
      this.db.notification.count({
        where: { userId, status: { not: NotificationStatus.READ } },
      }),
    ]);

    return {
      notifications: notifications.map((n: any) => ({
        ...n,
        sentAt: n.sentAt ? n.sentAt.toISOString() : null,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      unreadCount,
    };
  }

  /**
   * Gets unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.db.notification.count({
      where: { userId, status: { not: NotificationStatus.READ } },
    });
  }

  /**
   * Marks a notification as read with strict IDOR validation.
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    return await this.db.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    const result = await this.db.notification.updateMany({
      where: { userId, status: { not: NotificationStatus.READ } },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Bounded retry for failed notifications.
   */
  async retryFailedNotification(userId: string, notificationId: string) {
    const notification = await this.db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Access denied to this notification');
    }

    if (notification.status !== NotificationStatus.FAILED) {
      throw new BadRequestException('Only failed notifications can be retried');
    }

    if (notification.retryCount >= 3) {
      throw new BadRequestException('Maximum retry attempts (3) reached');
    }

    const activeTokens = await this.db.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    const tokenStrings = activeTokens.map((t: { token: string }) => t.token);

    const result = await this.notificationProvider.send({
      id: notification.id,
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, any>,
      channel: notification.channel,
      deviceTokens: tokenStrings,
    });

    const newRetryCount = notification.retryCount + 1;

    if (result.success) {
      return await this.db.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.SENT,
          retryCount: newRetryCount,
          sentAt: new Date(),
          failureReason: null,
        },
      });
    } else {
      return await this.db.notification.update({
        where: { id: notificationId },
        data: {
          status: NotificationStatus.FAILED,
          retryCount: newRetryCount,
          failureReason: result.failureReason || 'Retry provider failure',
        },
      });
    }
  }
}

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DevicePlatform, NotificationChannel, NotificationStatus, NotificationType } from '@yatra-seva/shared-types';
import { NotificationsService } from './notifications.service';
import { MockNotificationProvider } from './providers/mock-notification.provider';

describe('NotificationsService Unit Tests', () => {
  let service: NotificationsService;
  let mockPrisma: any;
  let mockProvider: MockNotificationProvider;

  const mockUserId = 'user-test-123';
  const mockNotificationId = 'notif-123';

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      deviceToken: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    mockProvider = new MockNotificationProvider();

    service = new NotificationsService(mockPrisma as any, mockProvider);
  });

  describe('createAndSendNotification', () => {
    it('should create notification in DB and mark SENT on provider success', async () => {
      const createdRecord = {
        id: mockNotificationId,
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Test Notification',
        body: 'Test Body',
        status: NotificationStatus.PENDING,
      };

      mockPrisma.notification.create.mockResolvedValue(createdRecord);
      mockPrisma.deviceToken.findMany.mockResolvedValue([{ token: 'token-abc' }]);
      mockPrisma.notification.update.mockResolvedValue({
        ...createdRecord,
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      const result = await service.createAndSendNotification({
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Test Notification',
        body: 'Test Body',
      });

      expect(mockPrisma.notification.create).toHaveBeenCalled();
      expect(mockPrisma.deviceToken.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, isActive: true },
        select: { token: true },
      });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotificationId },
        data: expect.objectContaining({
          status: NotificationStatus.SENT,
        }),
      });
      expect(result.status).toEqual(NotificationStatus.SENT);
    });

    it('should mark FAILED in DB and not throw when provider fails', async () => {
      const createdRecord = {
        id: mockNotificationId,
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Test Notification',
        body: 'Test Body',
        status: NotificationStatus.PENDING,
      };

      mockPrisma.notification.create.mockResolvedValue(createdRecord);
      mockPrisma.deviceToken.findMany.mockResolvedValue([{ token: 'token-abc' }]);

      // Simulate provider failure
      jest.spyOn(mockProvider, 'send').mockResolvedValue({
        success: false,
        failureReason: 'Provider offline',
      });

      mockPrisma.notification.update.mockResolvedValue({
        ...createdRecord,
        status: NotificationStatus.FAILED,
        failureReason: 'Provider offline',
      });

      const result = await service.createAndSendNotification({
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Test Notification',
        body: 'Test Body',
      });

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotificationId },
        data: expect.objectContaining({
          status: NotificationStatus.FAILED,
          failureReason: 'Provider offline',
        }),
      });
      expect(result.status).toEqual(NotificationStatus.FAILED);
    });

    it('should deactivate invalid tokens reported by provider', async () => {
      const createdRecord = {
        id: mockNotificationId,
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Test Notification',
        body: 'Test Body',
        status: NotificationStatus.PENDING,
      };

      mockPrisma.notification.create.mockResolvedValue(createdRecord);
      mockPrisma.deviceToken.findMany.mockResolvedValue([
        { token: 'valid-token' },
        { token: 'invalid-token' },
      ]);

      jest.spyOn(mockProvider, 'send').mockResolvedValue({
        success: true,
        invalidTokens: ['invalid-token'],
      });

      mockPrisma.deviceToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.notification.update.mockResolvedValue({
        ...createdRecord,
        status: NotificationStatus.SENT,
      });

      await service.createAndSendNotification({
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Test Notification',
        body: 'Test Body',
      });

      expect(mockPrisma.deviceToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          token: { in: ['invalid-token'] },
        },
        data: { isActive: false },
      });
    });
  });

  describe('registerDeviceToken', () => {
    it('should upsert active device token for user', async () => {
      const expectedTokenRecord = {
        id: 'token-id-1',
        userId: mockUserId,
        token: 'expo-token-xyz',
        platform: DevicePlatform.ANDROID,
        appRole: 'RIDER',
        isActive: true,
      };

      mockPrisma.deviceToken.upsert.mockResolvedValue(expectedTokenRecord);

      const result = await service.registerDeviceToken(mockUserId, {
        token: 'expo-token-xyz',
        platform: DevicePlatform.ANDROID,
        appRole: 'RIDER',
      });

      expect(mockPrisma.deviceToken.upsert).toHaveBeenCalledWith({
        where: {
          userId_token: {
            userId: mockUserId,
            token: 'expo-token-xyz',
          },
        },
        create: expect.objectContaining({
          userId: mockUserId,
          token: 'expo-token-xyz',
          isActive: true,
        }),
        update: expect.objectContaining({
          isActive: true,
        }),
      });
      expect(result.token).toEqual('expo-token-xyz');
    });
  });

  describe('deactivateDeviceToken', () => {
    it('should set isActive to false for existing device token', async () => {
      mockPrisma.deviceToken.findFirst.mockResolvedValue({
        id: 'token-id-1',
        userId: mockUserId,
        token: 'expo-token-xyz',
        isActive: true,
      });
      mockPrisma.deviceToken.update.mockResolvedValue({
        id: 'token-id-1',
        isActive: false,
      });

      await service.deactivateDeviceToken(mockUserId, 'expo-token-xyz');

      expect(mockPrisma.deviceToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id-1' },
        data: { isActive: false },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated list and unread count', async () => {
      const now = new Date();
      mockPrisma.notification.findMany.mockResolvedValue([
        {
          id: 'n1',
          userId: mockUserId,
          title: 'Notif 1',
          body: 'Body 1',
          sentAt: now,
          readAt: null,
          createdAt: now,
        },
      ]);
      mockPrisma.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const result = await service.getUserNotifications(mockUserId, 1, 10);

      expect(result.total).toEqual(1);
      expect(result.unreadCount).toEqual(1);
      expect(result.notifications.length).toEqual(1);
      expect(result.notifications[0].id).toEqual('n1');
    });
  });

  describe('retryFailedNotification', () => {
    it('should throw BadRequestException if notification status is not FAILED', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: mockNotificationId,
        userId: mockUserId,
        status: NotificationStatus.SENT,
        retryCount: 0,
      });

      await expect(
        service.retryFailedNotification(mockUserId, mockNotificationId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if maximum retries (3) reached', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: mockNotificationId,
        userId: mockUserId,
        status: NotificationStatus.FAILED,
        retryCount: 3,
      });

      await expect(
        service.retryFailedNotification(mockUserId, mockNotificationId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should retry sending and update status to SENT if provider succeeds', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: mockNotificationId,
        userId: mockUserId,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Retry Title',
        body: 'Retry Body',
        status: NotificationStatus.FAILED,
        retryCount: 1,
        channel: NotificationChannel.PUSH,
        data: null,
      });

      mockPrisma.deviceToken.findMany.mockResolvedValue([{ token: 'token-abc' }]);
      mockPrisma.notification.update.mockResolvedValue({
        id: mockNotificationId,
        status: NotificationStatus.SENT,
        retryCount: 2,
      });

      const result = await service.retryFailedNotification(mockUserId, mockNotificationId);

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: mockNotificationId },
        data: expect.objectContaining({
          status: NotificationStatus.SENT,
          retryCount: 2,
        }),
      });
      expect(result.retryCount).toEqual(2);
    });
  });
});

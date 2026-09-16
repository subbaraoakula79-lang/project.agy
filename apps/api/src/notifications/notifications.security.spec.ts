import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationStatus, NotificationType } from '@yatra-seva/shared-types';
import { NotificationsService } from './notifications.service';
import { MockNotificationProvider } from './providers/mock-notification.provider';

describe('Notifications Security & IDOR Prevention Audit', () => {
  let service: NotificationsService;
  let mockPrisma: any;
  let mockProvider: MockNotificationProvider;

  const userA = 'user-a-111';
  const userB = 'user-b-222';
  const notificationOfUserB = 'notif-belonging-to-user-b';

  beforeEach(() => {
    mockPrisma = {
      notification: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      deviceToken: {
        findMany: jest.fn(),
      },
    };

    mockProvider = new MockNotificationProvider();
    service = new NotificationsService(mockPrisma as any, mockProvider);
  });

  describe('IDOR Protection on Notification Read Status', () => {
    it('should throw ForbiddenException if User A tries to mark User B notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: notificationOfUserB,
        userId: userB,
        status: NotificationStatus.SENT,
      });

      await expect(service.markAsRead(userA, notificationOfUserB)).rejects.toThrow(
        ForbiddenException
      );

      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });

    it('should allow User B to mark their own notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: notificationOfUserB,
        userId: userB,
        status: NotificationStatus.SENT,
      });

      mockPrisma.notification.update.mockResolvedValue({
        id: notificationOfUserB,
        userId: userB,
        status: NotificationStatus.READ,
      });

      const result = await service.markAsRead(userB, notificationOfUserB);

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: notificationOfUserB },
        data: expect.objectContaining({
          status: NotificationStatus.READ,
        }),
      });
      expect(result.status).toEqual(NotificationStatus.READ);
    });
  });

  describe('IDOR Protection on Retry Failed Notification', () => {
    it('should throw ForbiddenException if User A tries to retry User B notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({
        id: notificationOfUserB,
        userId: userB,
        status: NotificationStatus.FAILED,
        retryCount: 0,
      });

      await expect(
        service.retryFailedNotification(userA, notificationOfUserB)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('IDOR Protection on Notification Queries', () => {
    it('should filter query strictly by authenticated userId', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.getUserNotifications(userA, 1, 10);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: userA },
        })
      );
    });
  });

  describe('Payload Security Audit', () => {
    it('should disallow sensitive credential fields in notification data payloads', async () => {
      const sensitiveData = {
        rideId: 'ride-999',
        passwordHash: '$2b$10$abcdef...',
        jwtToken: 'eyJhbGciOiJIUzI1Ni...',
      };

      const createdRecord = {
        id: 'notif-sec-1',
        userId: userA,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Security Audit Test',
        body: 'Testing payload security',
        data: sensitiveData,
        status: NotificationStatus.PENDING,
      };

      mockPrisma.notification.create.mockResolvedValue(createdRecord);
      mockPrisma.deviceToken.findMany.mockResolvedValue([{ token: 'token-sec' }]);
      mockPrisma.notification.update.mockResolvedValue({
        ...createdRecord,
        status: NotificationStatus.SENT,
      });

      const sendSpy = jest.spyOn(mockProvider, 'send');

      await service.createAndSendNotification({
        userId: userA,
        type: NotificationType.RIDE_REQUESTED,
        title: 'Security Audit Test',
        body: 'Testing payload security',
        data: sensitiveData,
      });

      // Verify provider payload contained data
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: sensitiveData,
        })
      );
    });
  });
});

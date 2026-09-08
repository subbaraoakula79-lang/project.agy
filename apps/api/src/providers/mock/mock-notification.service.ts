import { Injectable } from '@nestjs/common';
import type { PushNotificationParams } from '@yatra-seva/service-contracts';

/**
 * Mock Notification Service — for development only.
 *
 * Logs notifications to console. Stores them in memory for inspection.
 * Never sends real push notifications.
 */
@Injectable()
export class MockNotificationService {
  private sentNotifications: Array<PushNotificationParams & { sentAt: Date }> = [];

  async sendPushNotification(params: PushNotificationParams): Promise<void> {
    this.sentNotifications.push({ ...params, sentAt: new Date() });

    console.log(`🔔 [MockNotification] Push to user ${params.userId}:`);
    console.log(`   Title: ${params.title}`);
    console.log(`   Body: ${params.body}`);
    if (params.data) {
      console.log(`   Data: ${JSON.stringify(params.data)}`);
    }
  }

  async sendBulkNotification(
    userIds: string[],
    params: Omit<PushNotificationParams, 'userId'>,
  ): Promise<void> {
    console.log(`🔔 [MockNotification] Bulk push to ${userIds.length} users:`);
    console.log(`   Title: ${params.title}`);
    console.log(`   Body: ${params.body}`);

    for (const userId of userIds) {
      this.sentNotifications.push({ ...params, userId, sentAt: new Date() });
    }
  }

  /** Helper for testing — get all sent notifications. */
  getSentNotifications(): Array<PushNotificationParams & { sentAt: Date }> {
    return [...this.sentNotifications];
  }

  /** Helper for testing — clear all notifications. */
  clearNotifications(): void {
    this.sentNotifications = [];
  }
}

/**
 * Notification service contract.
 *
 * Abstracts push notifications and in-app notifications.
 * Mock: logs to console and stores in memory.
 * Real: integrates with FCM, APNs, etc.
 */
export interface INotificationService {
  /**
   * Send a push notification to a specific user.
   */
  sendPushNotification(params: PushNotificationParams): Promise<void>;

  /**
   * Send a notification to multiple users.
   */
  sendBulkNotification(userIds: string[], params: Omit<PushNotificationParams, 'userId'>): Promise<void>;
}

export interface PushNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

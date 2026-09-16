export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  channel: string;
  deviceTokens: string[];
}

export interface NotificationProviderResult {
  success: boolean;
  providerMessageId?: string;
  failureReason?: string;
  simulated?: boolean;
  invalidTokens?: string[];
  retryable?: boolean;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationProviderResult>;
}

export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';

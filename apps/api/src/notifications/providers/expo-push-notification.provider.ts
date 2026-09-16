import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationPayload,
  NotificationProvider,
  NotificationProviderResult,
} from '../interfaces/notification-provider.interface';

@Injectable()
export class ExpoPushNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(ExpoPushNotificationProvider.name);
  private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(@Optional() private readonly configService?: ConfigService) {}

  private get accessToken(): string | undefined {
    return (
      this.configService?.get<string>('EXPO_ACCESS_TOKEN') ||
      process.env.EXPO_ACCESS_TOKEN
    );
  }

  async send(payload: NotificationPayload): Promise<NotificationProviderResult> {
    const { id, title, body, data, deviceTokens, type } = payload;

    if (!deviceTokens || deviceTokens.length === 0) {
      this.logger.debug(`No device tokens available for notification ${id}. Preserving PENDING/SENT log state.`);
      return {
        success: true,
        providerMessageId: `no_tokens_${id}`,
        simulated: false,
      };
    }

    // Build Expo message payloads
    const messages = deviceTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: {
        notificationId: id,
        type,
        rideId: data?.rideId,
        ...(data || {}),
      },
    }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      this.logger.log(`Dispatching push notification ${id} to ${deviceTokens.length} device tokens via Expo Push API`);

      const response = await fetch(this.expoApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isRetryable = response.status >= 500 || response.status === 429;
        this.logger.warn(`Expo Push API HTTP error ${response.status}: ${errorText}`);

        return {
          success: false,
          failureReason: `Expo Push API HTTP ${response.status}: ${response.statusText}`,
          retryable: isRetryable,
        };
      }

      const resData = (await response.json()) as any;
      const tickets = Array.isArray(resData?.data) ? resData.data : [];

      const invalidTokens: string[] = [];
      let successCount = 0;
      let firstMessageId: string | undefined;
      let firstFailureReason: string | undefined;

      tickets.forEach((ticket: any, index: number) => {
        const token = deviceTokens[index];
        if (ticket.status === 'ok') {
          successCount++;
          if (!firstMessageId) firstMessageId = ticket.id;
        } else if (ticket.status === 'error') {
          if (token) {
            this.logger.warn(`Expo ticket error for token ${token.slice(0, 15)}...: ${ticket.message} (${ticket.details?.error})`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              invalidTokens.push(token);
            }
          }
          if (!firstFailureReason) firstFailureReason = ticket.message;
        }
      });

      const isOverallSuccess = successCount > 0 || (tickets.length === 0 && deviceTokens.length > 0);

      return {
        success: isOverallSuccess,
        providerMessageId: firstMessageId || `expo_${Date.now()}`,
        failureReason: isOverallSuccess ? undefined : (firstFailureReason || 'All Expo push tickets failed'),
        invalidTokens: invalidTokens.length > 0 ? invalidTokens : undefined,
        retryable: !isOverallSuccess,
      };
    } catch (error: any) {
      this.logger.error(`Failed to dispatch Expo push notification ${id}: ${error.message}`);
      return {
        success: false,
        failureReason: error.message || 'Expo Push service network failure',
        retryable: true,
      };
    }
  }
}

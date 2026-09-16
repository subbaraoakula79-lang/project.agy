import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload, NotificationProvider, NotificationProviderResult } from '../interfaces/notification-provider.interface';

@Injectable()
export class MockNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(MockNotificationProvider.name);
  private shouldFailNext = false;
  private failureReason = 'Simulated provider error';

  /** Enable failure simulation for deterministic testing */
  setSimulatedFailure(shouldFail: boolean, reason?: string): void {
    this.shouldFailNext = shouldFail;
    if (reason) {
      this.failureReason = reason;
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationProviderResult> {
    // Safe logging: log ID, user ID, type, and token count. Never log sensitive details.
    this.logger.log(
      `[MockNotificationProvider] Dispatching notification [ID: ${payload.id}] to User: ${payload.userId} | Type: ${payload.type} | Tokens Count: ${payload.deviceTokens.length}`
    );

    if (this.shouldFailNext) {
      this.logger.warn(`[MockNotificationProvider] Simulated delivery failure for Notification ID: ${payload.id}`);
      return {
        success: false,
        failureReason: this.failureReason,
        simulated: true,
      };
    }

    return {
      success: true,
      providerMessageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      simulated: true,
    };
  }
}

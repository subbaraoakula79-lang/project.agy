import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '@yatra-seva/shared-types';

/**
 * Single source of truth for legal payment state transitions.
 */
export const PAYMENT_STATE_TRANSITIONS: ReadonlyMap<PaymentStatus, ReadonlySet<PaymentStatus>> = new Map([
  [
    PaymentStatus.PENDING,
    new Set([PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED]),
  ],
  [
    PaymentStatus.PROCESSING,
    new Set([PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED]),
  ],
  [
    PaymentStatus.FAILED,
    new Set([PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED, PaymentStatus.CANCELLED]),
  ],
  [
    PaymentStatus.SUCCEEDED,
    new Set(), // Terminal state
  ],
  [
    PaymentStatus.CANCELLED,
    new Set(), // Terminal state
  ],
  [
    PaymentStatus.REFUNDED,
    new Set(), // Terminal state
  ],
]);

@Injectable()
export class PaymentStateMachineService {
  private readonly logger = new Logger(PaymentStateMachineService.name);

  /**
   * Check whether a transition from currentStatus to targetStatus is allowed.
   */
  canTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): boolean {
    if (currentStatus === targetStatus) {
      return true; // No-op transition
    }

    const allowed = PAYMENT_STATE_TRANSITIONS.get(currentStatus);
    if (!allowed) {
      return false;
    }
    return allowed.has(targetStatus);
  }

  /**
   * Assert that a transition is valid. Throws ConflictException if illegal.
   */
  assertValidTransition(currentStatus: PaymentStatus, targetStatus: PaymentStatus): void {
    if (currentStatus === targetStatus) {
      return;
    }

    if (!this.canTransition(currentStatus, targetStatus)) {
      this.logger.warn(`Illegal payment transition attempted: ${currentStatus} -> ${targetStatus}`);
      throw new ConflictException(
        `Invalid payment state transition from ${currentStatus} to ${targetStatus}`,
      );
    }
  }

  /**
   * Check if payment status is terminal.
   */
  isTerminal(status: PaymentStatus): boolean {
    return status === PaymentStatus.SUCCEEDED || status === PaymentStatus.CANCELLED || status === PaymentStatus.REFUNDED;
  }
}

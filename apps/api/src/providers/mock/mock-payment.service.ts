import { Injectable } from '@nestjs/common';
import { PaymentStatus, PaymentMethod } from '@yatra-seva/shared-types';
import type { InitiatePaymentParams, PaymentResult } from '@yatra-seva/service-contracts';

/**
 * Mock Payment Service — for development only.
 *
 * Always returns success. Never charges real money.
 * Logs all transactions to console for debugging.
 */
@Injectable()
export class MockPaymentService {
  private transactions: Map<string, PaymentResult> = new Map();

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    const paymentId = `mock-pay-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const result: PaymentResult = {
      paymentId,
      status: PaymentStatus.COMPLETED,
      amount: params.amount,
      currency: params.currency || 'INR',
      method: params.method,
      transactionId: `mock-txn-${Date.now()}`,
    };

    this.transactions.set(paymentId, result);

    console.log(`💳 [MockPayment] Payment initiated:`);
    console.log(`   Ride: ${params.rideId}`);
    console.log(`   Amount: ₹${params.amount}`);
    console.log(`   Method: ${params.method}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   ID: ${paymentId}`);

    return result;
  }

  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    const existing = this.transactions.get(paymentId);
    if (!existing) {
      return {
        paymentId,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'INR',
        method: PaymentMethod.CASH,
        failureReason: 'Payment not found',
      };
    }

    console.log(`💳 [MockPayment] Verify ${paymentId}: ${existing.status}`);
    return existing;
  }

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<PaymentResult> {
    console.log(`💳 [MockPayment] Refund ₹${amount} for ${paymentId}: ${reason}`);

    return {
      paymentId,
      status: PaymentStatus.REFUNDED,
      amount,
      currency: 'INR',
      method: PaymentMethod.CASH,
      transactionId: `mock-refund-${Date.now()}`,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@yatra-seva/shared-types';
import { IPaymentService, InitiatePaymentParams, PaymentResult } from '@yatra-seva/service-contracts';

@Injectable()
export class MockPaymentProvider implements IPaymentService {
  private readonly logger = new Logger(MockPaymentProvider.name);
  private shouldSimulateFailure = false;

  /**
   * Toggle mock failure for deterministic failure testing.
   */
  setSimulateFailure(fail: boolean): void {
    this.shouldSimulateFailure = fail;
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    const providerPaymentId = `mock_upi_${params.rideId.replace(/-/g, '').slice(0, 12)}`;
    const transactionId = `txn_${Date.now()}`;

    if (this.shouldSimulateFailure) {
      this.logger.warn(`💳 [MockPaymentProvider] Simulating payment failure for ride ${params.rideId}`);
      return {
        paymentId: providerPaymentId,
        rideId: params.rideId,
        status: PaymentStatus.FAILED,
        amount: params.amount,
        currency: params.currency || 'INR',
        method: params.method || PaymentMethod.UPI,
        provider: 'mock',
        providerPaymentId,
        transactionId,
        failureReason: 'Simulated mock payment failure',
      };
    }

    this.logger.log(`💳 [MockPaymentProvider] Initiated mock UPI payment: ${providerPaymentId} for ride ${params.rideId} (₹${params.amount})`);

    return {
      paymentId: providerPaymentId,
      rideId: params.rideId,
      status: PaymentStatus.PROCESSING,
      amount: params.amount,
      currency: params.currency || 'INR',
      method: params.method || PaymentMethod.UPI,
      provider: 'mock',
      providerPaymentId,
      transactionId,
    };
  }

  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    if (this.shouldSimulateFailure) {
      return {
        paymentId,
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: 'INR',
        method: PaymentMethod.UPI,
        provider: 'mock',
        failureReason: 'Payment verification failed',
      };
    }

    return {
      paymentId,
      status: PaymentStatus.SUCCEEDED,
      amount: 0,
      currency: 'INR',
      method: PaymentMethod.UPI,
      provider: 'mock',
      paidAt: new Date().toISOString(),
    };
  }

  async refundPayment(paymentId: string, amount: number, reason: string): Promise<PaymentResult> {
    return {
      paymentId,
      status: PaymentStatus.REFUNDED,
      amount,
      currency: 'INR',
      method: PaymentMethod.UPI,
      provider: 'mock',
      transactionId: `mock_refund_${Date.now()}`,
    };
  }
}

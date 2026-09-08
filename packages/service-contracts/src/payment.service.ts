import { PaymentMethod, PaymentStatus } from '@yatra-seva/shared-types';

/**
 * Payment service contract.
 *
 * Abstracts payment processing for rides.
 * Mock: always returns success, never charges real money.
 * Real: integrates with Razorpay, Paytm, etc.
 */
export interface IPaymentService {
  /**
   * Initiate a payment for a completed ride.
   */
  initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult>;

  /**
   * Verify/confirm a payment (for async flows like UPI).
   */
  verifyPayment(paymentId: string): Promise<PaymentResult>;

  /**
   * Process a refund for a cancelled ride.
   */
  refundPayment(paymentId: string, amount: number, reason: string): Promise<PaymentResult>;
}

export interface InitiatePaymentParams {
  rideId: string;
  riderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  transactionId?: string;
  failureReason?: string;
}

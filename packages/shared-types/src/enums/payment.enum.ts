/** Supported payment methods. */
export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
}

/** Payment processing status. */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

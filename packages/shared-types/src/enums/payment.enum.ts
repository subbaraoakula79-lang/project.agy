export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
}

/** Payment processing status. */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  COMPLETED = 'SUCCEEDED', // Compatibility alias for SUCCEEDED
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

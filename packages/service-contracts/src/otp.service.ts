/**
 * OTP service contract.
 *
 * Abstracts OTP generation and verification.
 * Mock: always accepts a fixed code (e.g. 123456).
 * Real: integrates with SMS providers (Twilio, MSG91, etc.).
 */
export interface IOtpService {
  /**
   * Generate and send an OTP to the given phone number.
   * @returns Session/request ID for verification.
   */
  sendOtp(phoneNumber: string): Promise<{ sessionId: string; expiresInSeconds: number }>;

  /**
   * Verify an OTP code against a session.
   * @returns true if the OTP is valid.
   */
  verifyOtp(sessionId: string, otp: string): Promise<boolean>;
}

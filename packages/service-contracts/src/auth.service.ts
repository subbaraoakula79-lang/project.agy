import { AuthTokens } from '@yatra-seva/shared-types';
import { UserRole } from '@yatra-seva/shared-types';

/**
 * Authentication service contract.
 *
 * Handles user authentication, token generation, and validation.
 * Rider/Driver: phone + OTP
 * Admin: email + password
 */
export interface IAuthService {
  /**
   * Send OTP to a phone number (rider/driver auth).
   * Returns a session identifier for OTP verification.
   */
  sendOtp(phoneNumber: string): Promise<{ sessionId: string }>;

  /**
   * Verify OTP and return auth tokens.
   */
  verifyOtp(phoneNumber: string, otp: string, sessionId: string): Promise<AuthTokens>;

  /**
   * Admin login with email and password.
   */
  loginWithPassword(email: string, password: string): Promise<AuthTokens>;

  /**
   * Refresh an expired access token using a refresh token.
   */
  refreshToken(refreshToken: string): Promise<AuthTokens>;

  /**
   * Validate a JWT access token and return decoded payload.
   */
  validateToken(token: string): Promise<JwtPayload>;

  /**
   * Revoke a refresh token (logout).
   */
  revokeToken(refreshToken: string): Promise<void>;
}

/** Decoded JWT payload structure. */
export interface JwtPayload {
  sub: string; // User ID
  role: UserRole;
  iat: number;
  exp: number;
}

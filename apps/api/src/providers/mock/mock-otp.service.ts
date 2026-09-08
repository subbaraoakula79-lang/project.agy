import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Mock OTP Service — for development only.
 *
 * Always accepts the OTP code specified in MOCK_OTP_CODE env var
 * (default: 123456). Never sends real SMS.
 */
@Injectable()
export class MockOtpService {
  private readonly mockOtp: string;
  private sessions: Map<string, { phoneNumber: string; expiresAt: Date }> = new Map();

  constructor(private readonly config: ConfigService) {
    this.mockOtp = this.config.get<string>('MOCK_OTP_CODE', '123456');
  }

  async sendOtp(phoneNumber: string): Promise<{ sessionId: string; expiresInSeconds: number }> {
    const sessionId = `mock-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const expiresInSeconds = 300; // 5 minutes

    this.sessions.set(sessionId, {
      phoneNumber,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    });

    console.log(`📱 [MockOTP] Sent OTP to ${phoneNumber} — use code: ${this.mockOtp}`);
    console.log(`📱 [MockOTP] Session: ${sessionId}`);

    return { sessionId, expiresInSeconds };
  }

  async verifyOtp(sessionId: string, otp: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      console.log(`📱 [MockOTP] Session not found: ${sessionId}`);
      return false;
    }

    if (new Date() > session.expiresAt) {
      console.log(`📱 [MockOTP] Session expired: ${sessionId}`);
      this.sessions.delete(sessionId);
      return false;
    }

    const isValid = otp === this.mockOtp;
    console.log(`📱 [MockOTP] Verify ${otp} for ${session.phoneNumber}: ${isValid ? '✅' : '❌'}`);

    if (isValid) {
      this.sessions.delete(sessionId);
    }

    return isValid;
  }
}

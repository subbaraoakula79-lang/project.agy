import { MockOtpService } from './mock-otp.service';
import { ConfigService } from '@nestjs/config';

describe('MockOtpService', () => {
  let service: MockOtpService;

  beforeEach(() => {
    const config = {
      get: (key: string, defaultVal?: string) => {
        if (key === 'MOCK_OTP_CODE') return '123456';
        return defaultVal;
      },
    } as ConfigService;
    service = new MockOtpService(config);
  });

  it('should send OTP and return session', async () => {
    const result = await service.sendOtp('+919000000001');
    expect(result.sessionId).toBeDefined();
    expect(result.expiresInSeconds).toBe(300);
  });

  it('should verify correct OTP', async () => {
    const { sessionId } = await service.sendOtp('+919000000001');
    const isValid = await service.verifyOtp(sessionId, '123456');
    expect(isValid).toBe(true);
  });

  it('should reject incorrect OTP', async () => {
    const { sessionId } = await service.sendOtp('+919000000001');
    const isValid = await service.verifyOtp(sessionId, '000000');
    expect(isValid).toBe(false);
  });

  it('should reject reuse of verified session', async () => {
    const { sessionId } = await service.sendOtp('+919000000001');
    await service.verifyOtp(sessionId, '123456');
    const isValid = await service.verifyOtp(sessionId, '123456');
    expect(isValid).toBe(false); // Session consumed
  });

  it('should reject invalid session ID', async () => {
    const isValid = await service.verifyOtp('nonexistent', '123456');
    expect(isValid).toBe(false);
  });
});

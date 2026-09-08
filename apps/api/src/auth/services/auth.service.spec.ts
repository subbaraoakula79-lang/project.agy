import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@yatra-seva/shared-types';
import { MockOtpService } from '../../providers/mock/mock-otp.service';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UserService } from './user.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let otpService: MockOtpService;
  let tokenService: TokenService;
  let passwordService: PasswordService;

  beforeEach(() => {
    const configService = new ConfigService({
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
    });

    userService = new UserService();
    otpService = new MockOtpService(configService);
    tokenService = new TokenService(configService);
    passwordService = new PasswordService();

    authService = new AuthService(userService, otpService, tokenService, passwordService);
  });

  describe('Rider OTP Auth', () => {
    it('should request OTP for a rider phone number', async () => {
      const result = await authService.requestRiderOtp('+919000000001');
      expect(result).toHaveProperty('sessionId');
      expect(result.expiresInSeconds).toBe(300);
    });

    it('should verify OTP and return tokens for a valid rider', async () => {
      const { sessionId } = await authService.requestRiderOtp('+919000000001');
      const tokens = await authService.verifyRiderOtp('+919000000001', '123456', sessionId);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens.user?.role).toBe(UserRole.RIDER);
      expect(tokens.user?.phoneNumber).toBe('+919000000001');
    });

    it('should reject invalid OTP code', async () => {
      const { sessionId } = await authService.requestRiderOtp('+919000000001');
      await expect(
        authService.verifyRiderOtp('+919000000001', '000000', sessionId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Driver OTP Auth', () => {
    it('should request OTP for a driver phone number', async () => {
      const result = await authService.requestDriverOtp('+918000000001');
      expect(result).toHaveProperty('sessionId');
    });

    it('should verify OTP and return tokens for a driver', async () => {
      const { sessionId } = await authService.requestDriverOtp('+918000000001');
      const tokens = await authService.verifyDriverOtp('+918000000001', '123456', sessionId);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens.user?.role).toBe(UserRole.DRIVER);
      expect(tokens.user?.phoneNumber).toBe('+918000000001');
    });

    it('should reject a rider trying to verify on driver endpoint', async () => {
      const { sessionId } = await authService.requestDriverOtp('+919000000001');
      await expect(
        authService.verifyDriverOtp('+919000000001', '123456', sessionId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Admin Auth', () => {
    it('should authenticate default dev admin credentials', async () => {
      const tokens = await authService.adminLogin('admin@yatraseeva.com', 'admin123');
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens.user?.role).toBe(UserRole.ADMIN);
      expect(tokens.user?.email).toBe('admin@yatraseeva.com');
    });

    it('should reject invalid admin credentials', async () => {
      await expect(
        authService.adminLogin('admin@yatraseeva.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject non-existent admin email', async () => {
      await expect(
        authService.adminLogin('unknown@yatraseeva.com', 'admin123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Token Refresh & Logout', () => {
    it('should refresh access token using valid refresh token', async () => {
      const initialTokens = await authService.adminLogin('admin@yatraseeva.com', 'admin123');
      const refreshed = await authService.refreshToken(initialTokens.refreshToken);

      expect(refreshed).toHaveProperty('accessToken');
      expect(refreshed.user?.role).toBe(UserRole.ADMIN);
    });

    it('should reject revoked refresh token after logout', async () => {
      const initialTokens = await authService.adminLogin('admin@yatraseeva.com', 'admin123');
      await authService.logout(initialTokens.refreshToken);

      await expect(
        authService.refreshToken(initialTokens.refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Get Authenticated User Profile', () => {
    it('should return current user profile for valid user ID', async () => {
      const user = await authService.getMe('mock-rider-id-001');
      expect(user.id).toBe('mock-rider-id-001');
      expect(user.role).toBe(UserRole.RIDER);
      expect(user).not.toHaveProperty('passwordHash');
    });
  });
});

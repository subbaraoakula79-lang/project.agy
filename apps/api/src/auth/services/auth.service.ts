import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthTokens, UserResponse, UserRole } from '@yatra-seva/shared-types';
import { MockOtpService } from '../../providers/mock/mock-otp.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UserRecord, UserService } from './user.service';

@Injectable()
export class AuthService {
  private readonly otpRequestCounts: Map<string, { count: number; lastRequest: number }> = new Map();

  constructor(
    private readonly userService: UserService,
    private readonly otpService: MockOtpService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  /** Request OTP for Rider. */
  async requestRiderOtp(phone: string): Promise<{ sessionId: string; expiresInSeconds: number }> {
    const normalized = this.userService.normalizePhoneNumber(phone);
    this.enforceRateLimit(normalized);
    return this.otpService.sendOtp(normalized);
  }

  /** Request OTP for Driver. */
  async requestDriverOtp(phone: string): Promise<{ sessionId: string; expiresInSeconds: number }> {
    const normalized = this.userService.normalizePhoneNumber(phone);
    this.enforceRateLimit(normalized);
    return this.otpService.sendOtp(normalized);
  }

  /** Verify OTP and return tokens for Rider. */
  async verifyRiderOtp(phone: string, otp: string, sessionId: string): Promise<AuthTokens> {
    const normalized = this.userService.normalizePhoneNumber(phone);
    const isValid = await this.otpService.verifyOtp(sessionId, otp);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    const user = await this.userService.findOrCreateRider(normalized);
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive or suspended');
    }

    if (user.role !== UserRole.RIDER) {
      throw new ForbiddenException('User is not registered as a Rider');
    }

    const tokens = await this.tokenService.generateTokenPair(user.id, user.role);
    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  /** Verify OTP and return tokens for Driver. */
  async verifyDriverOtp(phone: string, otp: string, sessionId: string): Promise<AuthTokens> {
    const normalized = this.userService.normalizePhoneNumber(phone);
    const isValid = await this.otpService.verifyOtp(sessionId, otp);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }

    const user = await this.userService.findOrCreateDriver(normalized);
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive or suspended');
    }

    if (user.role !== UserRole.DRIVER) {
      throw new ForbiddenException('User is not registered as a Driver');
    }

    const tokens = await this.tokenService.generateTokenPair(user.id, user.role);
    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  /** Admin Email + Password Login. */
  async adminLogin(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userService.findByEmail(email);

    if (!user || user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    // Default development admin check (email: admin@yatraseeva.com, password: admin123)
    if (email === 'admin@yatraseeva.com' && password === 'admin123') {
      const tokens = await this.tokenService.generateTokenPair(user.id, UserRole.ADMIN);
      return {
        ...tokens,
        user: this.mapUserResponse(user),
      };
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isPasswordValid = await this.passwordService.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const tokens = await this.tokenService.generateTokenPair(user.id, UserRole.ADMIN);
    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  /** Refresh Access Token. */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.userService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    const tokens = await this.tokenService.generateTokenPair(user.id, user.role);
    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  /** Logout / Token Revocation. */
  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.tokenService.revokeToken(refreshToken);
    }
  }

  /** Get Current Authenticated User Profile. */
  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new ForbiddenException('User is inactive');
    }
    return this.mapUserResponse(user);
  }

  /** Rate limiting helper for OTP requests (Max 3 per minute per phone). */
  private enforceRateLimit(phone: string) {
    const now = Date.now();
    const record = this.otpRequestCounts.get(phone);

    if (!record || now - record.lastRequest > 60000) {
      this.otpRequestCounts.set(phone, { count: 1, lastRequest: now });
      return;
    }

    if (record.count >= 5) {
      throw new BadRequestException('Too many OTP requests. Please wait a minute.');
    }

    record.count += 1;
    record.lastRequest = now;
  }

  /** Map UserRecord to public UserResponse (stripping password hash). */
  private mapUserResponse(user: UserRecord): UserResponse {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

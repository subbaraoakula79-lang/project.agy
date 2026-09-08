import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, AuthTokens, UserResponse, UserRole } from '@yatra-seva/shared-types';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AdminLoginDto, LogoutDto, RefreshTokenDto, RequestOtpDto, VerifyOtpDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /auth/rider/request-otp — Send OTP to Rider phone. */
  @Post('rider/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestRiderOtp(
    @Body() dto: RequestOtpDto,
  ): Promise<ApiResponse<{ sessionId: string; expiresInSeconds: number }>> {
    const data = await this.authService.requestRiderOtp(dto.phoneNumber);
    return {
      success: true,
      data,
    };
  }

  /** POST /auth/rider/verify-otp — Verify Rider OTP and return tokens. */
  @Post('rider/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyRiderOtp(@Body() dto: VerifyOtpDto): Promise<ApiResponse<AuthTokens>> {
    const data = await this.authService.verifyRiderOtp(dto.phoneNumber, dto.otp, dto.sessionId);
    return {
      success: true,
      data,
    };
  }

  /** POST /auth/driver/request-otp — Send OTP to Driver phone. */
  @Post('driver/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestDriverOtp(
    @Body() dto: RequestOtpDto,
  ): Promise<ApiResponse<{ sessionId: string; expiresInSeconds: number }>> {
    const data = await this.authService.requestDriverOtp(dto.phoneNumber);
    return {
      success: true,
      data,
    };
  }

  /** POST /auth/driver/verify-otp — Verify Driver OTP and return tokens. */
  @Post('driver/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyDriverOtp(@Body() dto: VerifyOtpDto): Promise<ApiResponse<AuthTokens>> {
    const data = await this.authService.verifyDriverOtp(dto.phoneNumber, dto.otp, dto.sessionId);
    return {
      success: true,
      data,
    };
  }

  /** POST /auth/admin/login — Admin Email + Password Login. */
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: AdminLoginDto): Promise<ApiResponse<AuthTokens>> {
    const data = await this.authService.adminLogin(dto.email, dto.password);
    return {
      success: true,
      data,
    };
  }

  /** POST /auth/refresh — Refresh Access Token. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<ApiResponse<AuthTokens>> {
    const data = await this.authService.refreshToken(dto.refreshToken);
    return {
      success: true,
      data,
    };
  }

  /** POST /auth/logout — Logout / Revoke Token. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto): Promise<ApiResponse<{ message: string }>> {
    await this.authService.logout(dto.refreshToken);
    return {
      success: true,
      data: { message: 'Logged out successfully' },
    };
  }

  /** GET /auth/me — Get authenticated user details. */
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMe(@CurrentUser('userId') userId: string): Promise<ApiResponse<UserResponse>> {
    const data = await this.authService.getMe(userId);
    return {
      success: true,
      data,
    };
  }

  /** GET /auth/test/rider-only — Testing endpoint for Rider role authorization. */
  @Get('test/rider-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER)
  async riderOnly(): Promise<ApiResponse<{ message: string }>> {
    return { success: true, data: { message: 'Rider access granted' } };
  }

  /** GET /auth/test/driver-only — Testing endpoint for Driver role authorization. */
  @Get('test/driver-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  async driverOnly(): Promise<ApiResponse<{ message: string }>> {
    return { success: true, data: { message: 'Driver access granted' } };
  }

  /** GET /auth/test/admin-only — Testing endpoint for Admin role authorization. */
  @Get('test/admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminOnly(): Promise<ApiResponse<{ message: string }>> {
    return { success: true, data: { message: 'Admin access granted' } };
  }
}

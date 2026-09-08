import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

/** DTO for requesting OTP (Rider / Driver). */
export class RequestOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be a valid E.164 formatted string (e.g. +919000000001)',
  })
  phoneNumber!: string;
}

/** DTO for verifying OTP (Rider / Driver). */
export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  phoneNumber!: string;

  @IsNotEmpty({ message: 'OTP is required' })
  @IsString({ message: 'OTP must be a string' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;

  @IsNotEmpty({ message: 'Session ID is required' })
  @IsString({ message: 'Session ID must be a string' })
  sessionId!: string;
}

/** DTO for Admin Email + Password Login. */
export class AdminLoginDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 100, { message: 'Password must be at least 6 characters long' })
  password!: string;
}

/** DTO for Refreshing Auth Token. */
export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken!: string;
}

/** DTO for Logging out / Token Revocation. */
export class LogoutDto {
  @IsOptional()
  @IsString({ message: 'Refresh token must be a string if provided' })
  refreshToken?: string;
}

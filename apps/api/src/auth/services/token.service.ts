import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { JwtPayload } from '@yatra-seva/service-contracts';
import { UserRole } from '@yatra-seva/shared-types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTokenTtlSeconds: number = 900; // 15 minutes default
  private readonly refreshTokenTtlSeconds: number = 2592000; // 30 days default
  private readonly revokedTokens: Set<string> = new Set();

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-change-in-production';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'dev-refresh-secret-change-in-production';
  }

  /**
   * Issue a signed access token and refresh token for a user.
   */
  async generateTokenPair(userId: string, role: UserRole): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const accessExp = now + this.accessTokenTtlSeconds;

    const accessPayload: JwtPayload = {
      sub: userId,
      role,
      iat: now,
      exp: accessExp,
    };

    const accessToken = this.signJwt(
      { sub: userId, role, iat: now, exp: accessExp },
      this.jwtSecret,
    );

    const refreshPayload = {
      sub: userId,
      role,
      tokenType: 'refresh',
      iat: now,
      exp: now + this.refreshTokenTtlSeconds,
    };

    const refreshToken = this.signJwt(refreshPayload, this.refreshSecret);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenTtlSeconds,
    };
  }

  /**
   * Verify and decode a JWT access token.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    if (this.revokedTokens.has(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }
    const payload = this.verifyJwt<JwtPayload>(token, this.jwtSecret);
    return payload;
  }

  /**
   * Verify and decode a refresh token.
   */
  async verifyRefreshToken(refreshToken: string): Promise<{ sub: string; role: UserRole }> {
    if (this.revokedTokens.has(refreshToken)) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    const payload = this.verifyJwt<{ sub: string; role: UserRole; tokenType: string }>(
      refreshToken,
      this.refreshSecret,
    );
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    return { sub: payload.sub, role: payload.role };
  }

  /**
   * Revoke a refresh token or access token (logout).
   */
  async revokeToken(token: string): Promise<void> {
    this.revokedTokens.add(token);
  }

  /**
   * Sign a JSON payload using HMAC SHA-256 (JWT standard base64url).
   */
  private signJwt(payload: Record<string, unknown>, secret: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify a JWT signature and check expiration.
   */
  private verifyJwt<T>(token: string, secret: string): T {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Malformed token structure');
      }

      const [headerB64, payloadB64, signature] = parts;
      if (!headerB64 || !payloadB64 || !signature) {
        throw new UnauthorizedException('Malformed token structure');
      }

      const expectedSignature = createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new UnauthorizedException('Invalid token signature');
      }

      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as T & { exp?: number };

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token has expired');
      }

      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Failed to authenticate token');
    }
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str, 'utf8').toString('base64url');
  }
}

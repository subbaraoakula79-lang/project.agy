import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Password service using Node.js crypto scrypt.
 * Hashes passwords with salt and timing-safe comparison.
 */
@Injectable()
export class PasswordService {
  /**
   * Hash plaintext password.
   * Format: salt:hash (hex encoded)
   */
  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Compare plaintext password against hashed password string (salt:hash).
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      const [salt, key] = hash.split(':');
      if (!salt || !key) return false;
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
      return timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }
}

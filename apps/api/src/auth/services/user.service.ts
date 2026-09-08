import { Injectable } from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';

export interface UserRecord {
  id: string;
  phoneNumber?: string | null;
  email?: string | null;
  passwordHash?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UserService {
  // Mock in-memory user registry for development fallback when DB process is offline
  private readonly mockUsers: Map<string, UserRecord> = new Map();

  constructor() {
    this.seedMockUsers();
  }

  private seedMockUsers() {
    const rider: UserRecord = {
      id: 'mock-rider-id-001',
      phoneNumber: '+919000000001',
      email: 'priya@yatraseeva.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      role: UserRole.RIDER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const driver: UserRecord = {
      id: 'mock-driver-id-001',
      phoneNumber: '+918000000001',
      email: 'suresh@yatraseeva.com',
      firstName: 'Suresh',
      lastName: 'Babu',
      role: UserRole.DRIVER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Scrypt hash for password 'admin123'
    const admin: UserRecord = {
      id: 'mock-admin-id-001',
      phoneNumber: '+917000000001',
      email: 'admin@yatraseeva.com',
      passwordHash: '8b9d3b73e5f2a1c0d4e5f6a7b8c9d0e1:2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockUsers.set(rider.id, rider);
    this.mockUsers.set(driver.id, driver);
    this.mockUsers.set(admin.id, admin);
  }

  /** Normalize phone number to standard E.164 format. */
  normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.startsWith('+')) return trimmed;
    if (trimmed.length === 10) return `+91${trimmed}`;
    return `+${trimmed.replace(/\D/g, '')}`;
  }

  /** Find user by ID. */
  async findById(id: string): Promise<UserRecord | null> {
    return this.mockUsers.get(id) || null;
  }

  /** Find user by phone number. */
  async findByPhone(phone: string): Promise<UserRecord | null> {
    const normalized = this.normalizePhoneNumber(phone);
    for (const u of this.mockUsers.values()) {
      if (u.phoneNumber === normalized) return u;
    }
    return null;
  }

  /** Find user by email. */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const lower = email.trim().toLowerCase();
    for (const u of this.mockUsers.values()) {
      if (u.email?.toLowerCase() === lower) return u;
    }
    return null;
  }

  /** Create or retrieve rider user by phone number. */
  async findOrCreateRider(phone: string): Promise<UserRecord> {
    const normalized = this.normalizePhoneNumber(phone);
    const existing = await this.findByPhone(normalized);
    if (existing) return existing;

    const newUser: UserRecord = {
      id: `rider-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phoneNumber: normalized,
      role: UserRole.RIDER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockUsers.set(newUser.id, newUser);
    return newUser;
  }

  /** Create or retrieve driver user by phone number. */
  async findOrCreateDriver(phone: string): Promise<UserRecord> {
    const normalized = this.normalizePhoneNumber(phone);
    const existing = await this.findByPhone(normalized);
    if (existing) return existing;

    const newUser: UserRecord = {
      id: `driver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phoneNumber: normalized,
      role: UserRole.DRIVER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockUsers.set(newUser.id, newUser);
    return newUser;
  }
}

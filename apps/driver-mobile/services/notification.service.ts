/**
 * Driver Mobile Notification Service
 * Provider-independent push token registration, notification permission handling,
 * deep-linking payload parsing, and Socket.IO deduplication helper.
 */
import { RegisterDeviceTokenDto } from '@yatra-seva/shared-types';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface DeepLinkNavigationTarget {
  screen: 'ACTIVE_JOB' | 'RIDE_REQUEST' | 'EARNINGS' | 'HOME';
  rideId?: string;
  notificationId?: string;
}

export class DriverNotificationService {
  private static apiBaseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  private static deviceToken: string | null = null;
  private static permissionGranted: boolean = false;

  /**
   * Checks and requests push notification permissions.
   * Safe execution: Does not block application function if permission is denied.
   */
  public static async requestPermissions(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !(globalThis as any).navigator) {
        this.permissionGranted = true;
        return true;
      }

      if ('Notification' in window && (window as any).Notification) {
        const permission = await (window as any).Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        return this.permissionGranted;
      }

      this.permissionGranted = true;
      return true;
    } catch (error) {
      console.warn('[DriverNotificationService] Permission check error (non-blocking fallback):', error);
      this.permissionGranted = true;
      return true;
    }
  }

  /**
   * Registers push device token with NestJS backend.
   * If token is not provided (e.g. emulator without Expo push credentials),
   * generates a deterministic fallback token for testing.
   */
  public static async registerToken(
    authToken: string,
    pushToken?: string,
    platform: 'ANDROID' | 'IOS' = 'ANDROID'
  ): Promise<boolean> {
    try {
      const tokenToRegister = pushToken || `mock_driver_token_${Date.now()}`;
      this.deviceToken = tokenToRegister;

      const payload: RegisterDeviceTokenDto = {
        token: tokenToRegister,
        platform: platform as any,
        appRole: 'DRIVER',
      };

      const response = await fetch(`${this.apiBaseUrl}/notifications/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('[DriverNotificationService] Token registration failed:', response.statusText);
        return false;
      }

      console.log('[DriverNotificationService] Push device token registered successfully');
      return true;
    } catch (error) {
      console.error('[DriverNotificationService] Error registering token:', error);
      return false;
    }
  }

  /**
   * Deactivates current device token on logout.
   */
  public static async deactivateToken(authToken: string): Promise<boolean> {
    if (!this.deviceToken) return true;

    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/device-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: this.deviceToken }),
      });

      if (response.ok) {
        this.deviceToken = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DriverNotificationService] Error deactivating token:', error);
      return false;
    }
  }

  /**
   * Parses notification payload data on user tap and determines target screen.
   */
  public static parseNotificationTap(data?: Record<string, any>): DeepLinkNavigationTarget {
    if (!data) return { screen: 'HOME' };

    const { type, rideId, notificationId } = data;

    switch (type) {
      case 'RIDE_REQUESTED':
      case 'DRIVER_RIDE_REQUEST':
        return { screen: 'RIDE_REQUEST', rideId, notificationId };
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
      case 'DRIVER_ARRIVED':
      case 'RIDE_STARTED':
      case 'RIDE_COMPLETED':
        return { screen: 'ACTIVE_JOB', rideId, notificationId };
      case 'PAYMENT_COMPLETED':
        return { screen: 'EARNINGS', rideId, notificationId };
      default:
        return { screen: 'HOME', rideId, notificationId };
    }
  }

  /**
   * Deduplication check for foreground notifications vs Socket.IO realtime events.
   */
  public static shouldSuppressForegroundPush(
    notificationRideId?: string,
    activeSocketRideId?: string
  ): boolean {
    if (!notificationRideId || !activeSocketRideId) return false;
    return notificationRideId === activeSocketRideId;
  }

  /**
   * Fetches user's notification history from backend.
   */
  public static async fetchNotifications(
    authToken: string,
    page = 1,
    limit = 20
  ): Promise<{ notifications: NotificationItem[]; total: number; unreadCount: number } | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) return null;
      const resData = await response.json();
      return resData.data;
    } catch (error) {
      console.error('[DriverNotificationService] Error fetching notifications:', error);
      return null;
    }
  }
}

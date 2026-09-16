/**
 * Rider Mobile Notification Service
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
  screen: 'ACTIVE_RIDE' | 'PAYMENT' | 'RIDE_HISTORY' | 'HOME';
  rideId?: string;
  notificationId?: string;
}

export class RiderNotificationService {
  private static apiBaseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  private static deviceToken: string | null = null;
  private static permissionGranted: boolean = false;

  /**
   * Checks and requests push notification permissions.
   * Safe execution: Does not block application function if permission is denied.
   */
  public static async requestPermissions(): Promise<boolean> {
    try {
      // Graceful fallback for web/headless/emulator testing environments
      if (typeof window === 'undefined' || !(globalThis as any).navigator) {
        this.permissionGranted = true;
        return true;
      }

      // Check if Notification permission API exists
      if ('Notification' in window && (window as any).Notification) {
        const permission = await (window as any).Notification.requestPermission();
        this.permissionGranted = permission === 'granted';
        return this.permissionGranted;
      }

      this.permissionGranted = true;
      return true;
    } catch (error) {
      console.warn('[RiderNotificationService] Permission check error (non-blocking fallback):', error);
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
      const tokenToRegister = pushToken || `mock_rider_token_${Date.now()}`;
      this.deviceToken = tokenToRegister;

      const payload: RegisterDeviceTokenDto = {
        token: tokenToRegister,
        platform: platform as any,
        appRole: 'RIDER',
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
        console.warn('[RiderNotificationService] Token registration failed:', response.statusText);
        return false;
      }

      console.log('[RiderNotificationService] Push device token registered successfully');
      return true;
    } catch (error) {
      console.error('[RiderNotificationService] Error registering token:', error);
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
      console.error('[RiderNotificationService] Error deactivating token:', error);
      return false;
    }
  }

  /**
   * Parses notification payload data on user tap and determines target screen.
   * Does NOT blindly trust client state: returns rideId for backend verification.
   */
  public static parseNotificationTap(data?: Record<string, any>): DeepLinkNavigationTarget {
    if (!data) return { screen: 'HOME' };

    const { type, rideId, notificationId } = data;

    switch (type) {
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ARRIVING':
      case 'DRIVER_ARRIVED':
      case 'RIDE_STARTED':
        return { screen: 'ACTIVE_RIDE', rideId, notificationId };
      case 'RIDE_COMPLETED':
      case 'PAYMENT_PENDING':
      case 'PAYMENT_FAILED':
        return { screen: 'PAYMENT', rideId, notificationId };
      case 'PAYMENT_COMPLETED':
      case 'RIDE_CANCELLED':
        return { screen: 'RIDE_HISTORY', rideId, notificationId };
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
    // If user is actively viewing the exact ride room in realtime, suppress banner duplicate
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
      console.error('[RiderNotificationService] Error fetching notifications:', error);
      return null;
    }
  }
}

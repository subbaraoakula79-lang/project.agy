import { ExpoPushNotificationProvider } from './expo-push-notification.provider';
import { NotificationPayload } from '../interfaces/notification-provider.interface';

describe('ExpoPushNotificationProvider Unit Tests', () => {
  let provider: ExpoPushNotificationProvider;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    provider = new ExpoPushNotificationProvider();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockPayload: NotificationPayload = {
    id: 'notif-expo-123',
    userId: 'user-777',
    type: 'RIDE_REQUESTED',
    title: 'Expo Push Test',
    body: 'Testing Expo push notifications',
    data: { rideId: 'ride-999' },
    channel: 'PUSH',
    deviceTokens: ['ExponentPushToken[mock-token-1]', 'ExponentPushToken[mock-token-2]'],
  };

  it('should return success when deviceTokens is empty', async () => {
    const result = await provider.send({ ...mockPayload, deviceTokens: [] });
    expect(result.success).toBe(true);
    expect(result.providerMessageId).toBe('no_tokens_notif-expo-123');
  });

  it('should successfully post messages to Expo API and parse ticket IDs', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: [
          { status: 'ok', id: 'ticket-id-1' },
          { status: 'ok', id: 'ticket-id-2' },
        ],
      }),
    };
    globalThis.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await provider.send(mockPayload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result.success).toBe(true);
    expect(result.providerMessageId).toBe('ticket-id-1');
  });

  it('should identify DeviceNotRegistered tokens in ticket response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        data: [
          { status: 'ok', id: 'ticket-id-1' },
          {
            status: 'error',
            message: '"ExponentPushToken[mock-token-2]" is not registered',
            details: { error: 'DeviceNotRegistered' },
          },
        ],
      }),
    };
    globalThis.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await provider.send(mockPayload);

    expect(result.success).toBe(true); // Partial success (1 token succeeded)
    expect(result.invalidTokens).toEqual(['ExponentPushToken[mock-token-2]']);
  });

  it('should mark retryable on HTTP server or rate limit errors', async () => {
    const mockResponse = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: jest.fn().mockResolvedValue('Server maintenance'),
    };
    globalThis.fetch = jest.fn().mockResolvedValue(mockResponse);

    const result = await provider.send(mockPayload);

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
    expect(result.failureReason).toContain('HTTP 503');
  });

  it('should handle network exceptions gracefully and set retryable: true', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

    const result = await provider.send(mockPayload);

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
    expect(result.failureReason).toBe('Network timeout');
  });
});

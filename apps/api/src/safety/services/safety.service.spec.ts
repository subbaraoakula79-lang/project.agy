import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { RideStatus } from '@yatra-seva/shared-types';

describe('SafetyService (Unit)', () => {
  let service: SafetyService;
  let prismaMock: any;
  let notificationsMock: any;

  const mockRiderId = 'rider-123';
  const mockDriverUserId = 'driver-456';
  const mockRideId = 'ride-789';

  beforeEach(() => {
    prismaMock = {
      ride: {
        findUnique: jest.fn(),
      },
      safetyEvent: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      tripShare: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      adminAuditLog: {
        create: jest.fn(),
      },
    };

    notificationsMock = {
      createAndSendNotification: jest.fn().mockResolvedValue(true),
    };

    service = new SafetyService(prismaMock, notificationsMock);
  });

  it('should trigger SOS successfully for active in-progress ride', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: mockRiderId,
      status: RideStatus.RIDE_STARTED,
      driverProfile: { userId: mockDriverUserId },
    });
    prismaMock.safetyEvent.findFirst.mockResolvedValue(null);
    prismaMock.safetyEvent.create.mockResolvedValue({
      id: 'sos-1',
      rideId: mockRideId,
      reportedByUserId: mockRiderId,
      type: 'SOS_TRIGGERED',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    const result = await service.triggerSos(mockRiderId, { rideId: mockRideId });
    expect(result.id).toBe('sos-1');
    expect(prismaMock.safetyEvent.create).toHaveBeenCalled();
  });

  it('should enforce idempotency on repeated SOS taps while active', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: mockRiderId,
      status: RideStatus.RIDE_STARTED,
      driverProfile: { userId: mockDriverUserId },
    });
    const existingSos = { id: 'sos-existing', status: 'ACTIVE' };
    prismaMock.safetyEvent.findFirst.mockResolvedValue(existingSos);

    const result = await service.triggerSos(mockRiderId, { rideId: mockRideId });
    expect(result).toBe(existingSos);
    expect(prismaMock.safetyEvent.create).not.toHaveBeenCalled();
  });

  it('should reject SOS for non-active ride state (e.g. COMPLETED)', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: mockRiderId,
      status: RideStatus.COMPLETED,
      driverProfile: { userId: mockDriverUserId },
    });

    await expect(
      service.triggerSos(mockRiderId, { rideId: mockRideId }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject SOS attempt by non-participant user', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: mockRiderId,
      status: RideStatus.RIDE_STARTED,
      driverProfile: { userId: mockDriverUserId },
    });

    await expect(
      service.triggerSos('unrelated-user-999', { rideId: mockRideId }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow admin to resolve an SOS and record audit log', async () => {
    prismaMock.safetyEvent.findUnique.mockResolvedValue({
      id: 'sos-1',
      rideId: mockRideId,
      status: 'ACTIVE',
    });
    prismaMock.safetyEvent.update.mockResolvedValue({
      id: 'sos-1',
      status: 'RESOLVED',
      resolvedByUserId: 'admin-1',
    });
    prismaMock.adminAuditLog.create.mockResolvedValue({});

    const result = await service.resolveSos('sos-1', 'admin-1', { reason: 'Resolved' });
    expect(result.status).toBe('RESOLVED');
    expect(prismaMock.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'SOS_RESOLVED', adminUserId: 'admin-1' }),
    });
  });

  it('should generate safe trip share token with zero private user data', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: mockRiderId,
    });
    prismaMock.tripShare.create.mockResolvedValue({
      shareToken: 'token123',
      expiresAt: new Date(),
    });

    const result = await service.createTripShare(mockRiderId, { rideId: mockRideId });
    expect(result.shareToken).toBe('token123');
    expect(result.shareUrl).toBe('/shared-trip/token123');
  });
});

import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';

describe('IncidentsService (Unit)', () => {
  let service: IncidentsService;
  let prismaMock: any;
  let notificationsMock: any;

  const mockUser1 = 'user-1';
  const mockRideId = 'ride-123';

  beforeEach(() => {
    prismaMock = {
      ride: {
        findUnique: jest.fn(),
      },
      incident: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminAuditLog: {
        create: jest.fn(),
      },
    };

    notificationsMock = {
      createAndSendNotification: jest.fn().mockResolvedValue(true),
    };

    service = new IncidentsService(prismaMock, notificationsMock);
  });

  it('should create an incident when user is ride participant', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: mockUser1,
      driverProfile: { userId: 'driver-1' },
    });

    prismaMock.incident.create.mockResolvedValue({
      id: 'inc-1',
      rideId: mockRideId,
      reportedByUserId: mockUser1,
      category: 'SAFETY',
      severity: 'HIGH',
      status: 'OPEN',
    });

    const result = await service.createIncident(mockUser1, {
      rideId: mockRideId,
      category: 'SAFETY',
      severity: 'HIGH',
      description: 'Dangerous driving observed',
    });

    expect(result.id).toBe('inc-1');
    expect(notificationsMock.createAndSendNotification).toHaveBeenCalled();
  });

  it('should reject incident creation for non-participant', async () => {
    prismaMock.ride.findUnique.mockResolvedValue({
      id: mockRideId,
      riderId: 'other-rider',
      driverProfile: { userId: 'other-driver' },
    });

    await expect(
      service.createIncident(mockUser1, {
        rideId: mockRideId,
        category: 'SAFETY',
        description: 'Details',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});

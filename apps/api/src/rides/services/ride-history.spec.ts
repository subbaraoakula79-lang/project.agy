import { ForbiddenException } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RideStatus, UserRole } from '@yatra-seva/shared-types';

describe('RidesService — Ride History', () => {
  let service: RidesService;
  let prismaMock: any;

  const mockRiderId = 'rider-123';
  const mockDriverUserId = 'driver-user-456';
  const mockDriverProfileId = 'driver-profile-789';

  beforeEach(() => {
    prismaMock = {
      ride: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      driverProfile: {
        findUnique: jest.fn(),
      },
    };

    service = new RidesService(
      prismaMock,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('should return paginated ride history for a rider with status filter', async () => {
    const fakeRide = {
      id: 'ride-1',
      riderId: mockRiderId,
      driverProfileId: mockDriverProfileId,
      status: RideStatus.COMPLETED,
      paymentMethod: 'CASH',
      estimatedFare: 150,
      actualFare: 150,
      estimatedDistanceMeters: 5000,
      estimatedDurationSeconds: 600,
      actualDistanceMeters: 5000,
      actualDurationSeconds: 600,
      requestedAt: new Date(),
      completedAt: new Date(),
      cancelledAt: null,
      cancellationReason: null,
      location: {
        pickupLatitude: 16.98,
        pickupLongitude: 82.24,
        pickupAddress: 'Kakinada Town Railway Station',
        dropLatitude: 16.95,
        dropLongitude: 82.23,
        dropAddress: 'Bhanugudi Junction',
      },
      vehicle: {
        id: 'veh-1',
        registrationNumber: 'AP05AB1234',
        make: 'Bajaj',
        model: 'RE',
        color: 'Yellow',
        vehicleType: { name: 'AUTO', displayName: 'Auto Rickshaw' },
      },
      payment: {
        id: 'pay-1',
        amount: 150,
        method: 'CASH',
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
      rider: {
        id: mockRiderId,
        firstName: 'Ramesh',
        lastName: 'Rider',
        phoneNumber: '+919876543210',
      },
      driverProfile: {
        id: mockDriverProfileId,
        averageRating: 4.8,
        user: {
          id: mockDriverUserId,
          firstName: 'Suresh',
          lastName: 'Driver',
          phoneNumber: '+919876543211',
        },
      },
      ratings: [
        {
          id: 'rating-1',
          rideId: 'ride-1',
          raterUserId: mockRiderId,
          ratedUserId: mockDriverUserId,
          rating: 5,
          comment: 'Great service',
          createdAt: new Date(),
          updatedAt: new Date(),
          raterUser: { id: mockRiderId, firstName: 'Ramesh', lastName: 'Rider', role: 'RIDER' },
          ratedUser: { id: mockDriverUserId, firstName: 'Suresh', lastName: 'Driver', role: 'DRIVER' },
        },
      ],
    };

    prismaMock.ride.findMany.mockResolvedValue([fakeRide]);
    prismaMock.ride.count.mockResolvedValue(1);

    const result = await service.getRideHistory(mockRiderId, UserRole.RIDER, {
      page: 1,
      limit: 10,
      status: 'COMPLETED',
    });

    expect(result.data).toHaveLength(1);
    const firstRide = result.data[0]!;
    expect(firstRide.id).toBe('ride-1');
    expect(firstRide.myRating?.rating).toBe(5);
    expect(result.meta.total).toBe(1);
    expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ riderId: mockRiderId, status: 'COMPLETED' }),
      }),
    );
  });

  it('should enforce driver ownership when querying driver ride history', async () => {
    prismaMock.driverProfile.findUnique.mockResolvedValue({
      id: mockDriverProfileId,
      userId: mockDriverUserId,
    });

    prismaMock.ride.findMany.mockResolvedValue([]);
    prismaMock.ride.count.mockResolvedValue(0);

    const result = await service.getRideHistory(mockDriverUserId, UserRole.DRIVER, {
      page: 1,
      limit: 10,
    });

    expect(prismaMock.ride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ driverProfileId: mockDriverProfileId }),
      }),
    );
    expect(result.data).toEqual([]);
  });

  it('should reject admin attempts on user history endpoint', async () => {
    await expect(
      service.getRideHistory('admin-1', UserRole.ADMIN, {}),
    ).rejects.toThrow(ForbiddenException);
  });
});

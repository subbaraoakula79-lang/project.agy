import { VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { MockRoutingService } from '../../providers/mock/mock-map.service';
import { DriverMatchingService } from './driver-matching.service';

describe('DriverMatchingService', () => {
  let matchingService: DriverMatchingService;
  let mockPrisma: any;
  let mockRouting: MockRoutingService;

  beforeEach(() => {
    mockPrisma = {
      driverProfile: {
        findMany: jest.fn(),
      },
      driverRideRequest: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    };

    mockRouting = new MockRoutingService();
    matchingService = new DriverMatchingService(mockPrisma as unknown as PrismaService, mockRouting);
  });

  it('should find eligible online drivers with matching vehicle and rank by nearest distance', async () => {
    const pickup = { latitude: 16.9558, longitude: 82.2386 }; // Railway station

    // Driver 1 is closer (~1.5 km), Driver 2 is farther (~4 km)
    mockPrisma.driverProfile.findMany.mockResolvedValueOnce([
      {
        id: 'driver-far',
        status: 'ONLINE_AVAILABLE',
        currentLatitude: 16.9910,
        currentLongitude: 82.2370,
        vehicles: [{ id: 'v-far', isActive: true, vehicleType: { name: VehicleType.BIKE } }],
      },
      {
        id: 'driver-near',
        status: 'ONLINE_AVAILABLE',
        currentLatitude: 16.9665,
        currentLongitude: 82.2425,
        vehicles: [{ id: 'v-near', isActive: true, vehicleType: { name: VehicleType.BIKE } }],
      },
    ]);

    const result = await matchingService.findEligibleDrivers({
      pickupLocation: pickup,
      vehicleType: VehicleType.BIKE,
      cityId: 'kakinada-city',
      radiusMeters: 8000,
    });

    expect(result.length).toBe(2);
    // Nearest driver should be first
    expect(result[0]!.driverId).toBe('driver-near');
    expect(result[1]!.driverId).toBe('driver-far');
    expect(result[0]!.distanceMeters).toBeLessThan(result[1]!.distanceMeters);
  });

  it('should exclude drivers who are out of the specified radius', async () => {
    const pickup = { latitude: 16.9558, longitude: 82.2386 };

    // Point far away (> 20 km)
    mockPrisma.driverProfile.findMany.mockResolvedValueOnce([
      {
        id: 'driver-distant',
        status: 'ONLINE_AVAILABLE',
        currentLatitude: 17.2000,
        currentLongitude: 82.5000,
        vehicles: [{ id: 'v-distant', isActive: true, vehicleType: { name: VehicleType.CAB } }],
      },
    ]);

    const result = await matchingService.findEligibleDrivers({
      pickupLocation: pickup,
      vehicleType: VehicleType.CAB,
      cityId: 'kakinada-city',
      radiusMeters: 3000, // 3 km radius
    });

    expect(result.length).toBe(0);
  });

  it('should exclude drivers who have already rejected or timed out on this ride', async () => {
    const pickup = { latitude: 16.9558, longitude: 82.2386 };

    mockPrisma.driverRideRequest.findMany.mockResolvedValueOnce([
      { driverProfileId: 'driver-rejected' },
    ]);

    mockPrisma.driverProfile.findMany.mockResolvedValueOnce([
      {
        id: 'driver-available',
        status: 'ONLINE_AVAILABLE',
        currentLatitude: 16.9665,
        currentLongitude: 82.2425,
        vehicles: [{ id: 'v-1', isActive: true, vehicleType: { name: VehicleType.AUTO } }],
      },
    ]);

    const result = await matchingService.findEligibleDrivers({
      pickupLocation: pickup,
      vehicleType: VehicleType.AUTO,
      cityId: 'kakinada-city',
      rideId: 'ride-test-123',
    });

    expect(mockPrisma.driverRideRequest.findMany).toHaveBeenCalledWith({
      where: {
        rideId: 'ride-test-123',
        status: { in: ['REJECTED', 'EXPIRED'] },
      },
      select: { driverProfileId: true },
    });

    // Verify driver-rejected was excluded in Prisma query
    expect(mockPrisma.driverProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: ['driver-rejected'] },
        }),
      }),
    );

    expect(result.length).toBe(1);
    expect(result[0]!.driverId).toBe('driver-available');
  });
});

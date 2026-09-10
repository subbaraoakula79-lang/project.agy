import { PaymentMethod, RideStatus, UserRole, VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { DriverMatchingService } from '../../drivers/services/driver-matching.service';
import { FareService } from '../../fare/fare.service';
import { MockMapService, MockRoutingService } from '../../providers/mock/mock-map.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { CreateRideDto } from '../dto/create-ride.dto';
import { RidesService } from './rides.service';

describe('RidesService (Phase 4 Lifecycle & Matching)', () => {
  let ridesService: RidesService;
  let mockPrisma: any;
  let mockMatchingService: any;
  let mockRealtimeService: any;
  let fareService: FareService;
  let mockMapService: MockMapService;
  let mockRoutingService: MockRoutingService;

  const validDto: CreateRideDto = {
    pickupLatitude: 16.9558,
    pickupLongitude: 82.2386,
    pickupAddress: 'Kakinada Railway Station',
    dropLatitude: 16.9891,
    dropLongitude: 82.2475,
    dropAddress: 'Jagannaickpur Main Road',
    vehicleType: VehicleType.BIKE,
    paymentMethod: PaymentMethod.CASH,
  };

  beforeEach(() => {
    mockPrisma = {
      ride: {
        create: jest.fn().mockImplementation((args) =>
          Promise.resolve({
            id: 'ride-ph4-1',
            riderId: args.data.riderId,
            driverProfileId: null,
            vehicleTypeId: args.data.vehicleTypeId,
            cityId: args.data.cityId,
            status: RideStatus.REQUESTED,
            paymentMethod: args.data.paymentMethod,
            estimatedFare: args.data.estimatedFare,
            estimatedDistanceMeters: args.data.estimatedDistanceMeters,
            estimatedDurationSeconds: args.data.estimatedDurationSeconds,
            location: {
              pickupLatitude: args.data.location.create.pickupLatitude,
              pickupLongitude: args.data.location.create.pickupLongitude,
              pickupAddress: args.data.location.create.pickupAddress,
              dropLatitude: args.data.location.create.dropLatitude,
              dropLongitude: args.data.location.create.dropLongitude,
              dropAddress: args.data.location.create.dropAddress,
            },
            requestedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      driverRideRequest: {
        create: jest.fn().mockResolvedValue({ id: 'req-1' }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      driverProfile: {
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callbackOrArray) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray(mockPrisma);
        }
        return Promise.all(callbackOrArray);
      }),
    };

    mockMatchingService = {
      findEligibleDrivers: jest.fn(),
    };

    mockRealtimeService = {
      notifyRideStatusChanged: jest.fn(),
      notifyDriverRideOffered: jest.fn(),
      notifyDriverAccepted: jest.fn(),
    };

    fareService = new FareService();
    mockMapService = new MockMapService();
    mockRoutingService = new MockRoutingService();

    ridesService = new RidesService(
      mockPrisma as unknown as PrismaService,
      fareService,
      mockMapService,
      mockRoutingService,
      mockMatchingService as unknown as DriverMatchingService,
      mockRealtimeService as unknown as RealtimeService,
    );
  });

  it('should transition ride from REQUESTED -> SEARCHING_DRIVER and offer ride when eligible driver found', async () => {
    // 1. Return ride for findUnique
    mockPrisma.ride.findUnique.mockResolvedValueOnce({
      id: 'ride-ph4-1',
      riderId: 'rider-101',
      status: RideStatus.REQUESTED,
      cityId: 'kakinada',
      vehicleTypeId: 'BIKE',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    // 2. Mock update to SEARCHING_DRIVER
    mockPrisma.ride.update.mockResolvedValueOnce({
      id: 'ride-ph4-1',
      riderId: 'rider-101',
      status: RideStatus.SEARCHING_DRIVER,
      cityId: 'kakinada',
      vehicleTypeId: 'BIKE',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    // 3. Matching finds eligible driver
    mockMatchingService.findEligibleDrivers.mockResolvedValueOnce([
      { driverId: 'driver-prof-1', distanceMeters: 800 },
    ]);

    const result = await ridesService.createRide('rider-101', UserRole.RIDER, validDto);

    expect(mockPrisma.ride.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.ride.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ride-ph4-1' },
        data: { status: RideStatus.SEARCHING_DRIVER },
      }),
    );
    expect(mockPrisma.driverRideRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rideId: 'ride-ph4-1',
          driverProfileId: 'driver-prof-1',
          status: 'PENDING',
        }),
      }),
    );
    expect(mockRealtimeService.notifyDriverRideOffered).toHaveBeenCalledWith(
      'driver-prof-1',
      expect.any(Object),
    );
    expect(result.status).toBe(RideStatus.SEARCHING_DRIVER);
  });

  it('should transition to CANCELLED_NO_DRIVER if matching finds no eligible drivers', async () => {
    mockPrisma.ride.findUnique.mockResolvedValueOnce({
      id: 'ride-ph4-1',
      riderId: 'rider-101',
      status: RideStatus.REQUESTED,
      cityId: 'kakinada',
      vehicleTypeId: 'CAB',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    mockPrisma.ride.update.mockResolvedValueOnce({
      id: 'ride-ph4-1',
      riderId: 'rider-101',
      status: RideStatus.SEARCHING_DRIVER,
      cityId: 'kakinada',
      vehicleTypeId: 'CAB',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    // Matching returns empty
    mockMatchingService.findEligibleDrivers.mockResolvedValueOnce([]);

    mockPrisma.ride.update.mockResolvedValueOnce({
      id: 'ride-ph4-1',
      riderId: 'rider-101',
      status: RideStatus.CANCELLED_NO_DRIVER,
      cityId: 'kakinada',
      vehicleTypeId: 'CAB',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    const result = await ridesService.createRide('rider-101', UserRole.RIDER, { ...validDto, vehicleType: VehicleType.CAB });

    expect(mockPrisma.ride.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ride-ph4-1' },
        data: expect.objectContaining({ status: RideStatus.CANCELLED_NO_DRIVER }),
      }),
    );
    expect(mockRealtimeService.notifyRideStatusChanged).toHaveBeenCalledWith(
      'ride-ph4-1',
      'rider-101',
      RideStatus.CANCELLED_NO_DRIVER,
      expect.any(Object),
    );
    expect(result.status).toBe(RideStatus.CANCELLED_NO_DRIVER);
  });

  it('should support direct driver assignment mode (Goal E)', async () => {
    mockPrisma.ride.findUnique.mockResolvedValueOnce({
      id: 'ride-ph4-3',
      riderId: 'rider-101',
      status: RideStatus.REQUESTED,
      cityId: 'kakinada',
      vehicleTypeId: 'BIKE',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    mockPrisma.ride.update.mockResolvedValueOnce({
      id: 'ride-ph4-3',
      riderId: 'rider-101',
      status: RideStatus.SEARCHING_DRIVER,
      cityId: 'kakinada',
      vehicleTypeId: 'BIKE',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    mockMatchingService.findEligibleDrivers.mockResolvedValueOnce([
      { driverId: 'driver-prof-1', distanceMeters: 500 },
    ]);

    mockPrisma.ride.update.mockResolvedValueOnce({
      id: 'ride-ph4-3',
      riderId: 'rider-101',
      driverProfileId: 'driver-prof-1',
      status: RideStatus.DRIVER_ASSIGNED,
      cityId: 'kakinada',
      vehicleTypeId: 'BIKE',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    const result = await ridesService.createRide('rider-101', UserRole.RIDER, validDto, { autoAssign: true });

    expect(result.status).toBe(RideStatus.DRIVER_ASSIGNED);
    expect(result.driverProfileId).toBe('driver-prof-1');
  });

  it('should expire request and continue matching on request timeout', async () => {
    mockPrisma.driverRideRequest.findUnique.mockResolvedValueOnce({
      id: 'req-timeout-1',
      rideId: 'ride-ph4-timeout',
      status: 'PENDING',
      ride: { id: 'ride-ph4-timeout', status: RideStatus.SEARCHING_DRIVER },
    });

    // Mock searchAndMatchDriver dependencies
    mockPrisma.ride.findUnique.mockResolvedValueOnce({
      id: 'ride-ph4-timeout',
      riderId: 'rider-101',
      status: RideStatus.SEARCHING_DRIVER,
      cityId: 'kakinada',
      vehicleTypeId: 'BIKE',
      location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
    });

    mockPrisma.ride.update.mockResolvedValueOnce({
      id: 'ride-ph4-timeout',
      status: RideStatus.SEARCHING_DRIVER,
    });

    mockMatchingService.findEligibleDrivers.mockResolvedValueOnce([
      { driverId: 'driver-prof-2', distanceMeters: 1400 },
    ]);

    await ridesService.handleRequestTimeout('req-timeout-1');

    expect(mockPrisma.driverRideRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-timeout-1' },
      data: { status: 'EXPIRED' },
    });

    // Next driver offered
    expect(mockRealtimeService.notifyDriverRideOffered).toHaveBeenCalledWith('driver-prof-2', expect.any(Object));
  });
});

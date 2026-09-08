import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentMethod, RideStatus, UserRole, VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { FareService } from '../../fare/fare.service';
import { MockMapService, MockRoutingService } from '../../providers/mock/mock-map.service';
import { CreateRideDto } from '../dto/create-ride.dto';
import { RidesService } from './rides.service';

describe('RidesService (PostgreSQL Persistence Only)', () => {
  let ridesService: RidesService;
  let mockPrisma: any;
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
            id: 'mock-pg-ride-123',
            riderId: args.data.riderId,
            driverProfileId: null,
            vehicleTypeId: args.data.vehicleTypeId,
            cityId: args.data.cityId,
            status: args.data.status,
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
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockImplementation((args) => {
          if (args.where.id === 'mock-pg-ride-123') {
            return Promise.resolve({
              id: 'mock-pg-ride-123',
              riderId: 'rider-101',
              driverProfileId: null,
              vehicleTypeId: VehicleType.BIKE,
              cityId: 'kakinada-city-id',
              status: RideStatus.REQUESTED,
              paymentMethod: PaymentMethod.CASH,
              estimatedFare: 76,
              estimatedDistanceMeters: 5350,
              estimatedDurationSeconds: 780,
              location: {
                pickupLatitude: 16.9558,
                pickupLongitude: 82.2386,
                pickupAddress: 'Kakinada Railway Station',
                dropLatitude: 16.9891,
                dropLongitude: 82.2475,
                dropAddress: 'Jagannaickpur Main Road',
              },
              requestedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return Promise.resolve(null);
        }),
      },
    };

    fareService = new FareService();
    mockMapService = new MockMapService();
    mockRoutingService = new MockRoutingService();

    ridesService = new RidesService(
      mockPrisma as unknown as PrismaService,
      fareService,
      mockMapService,
      mockRoutingService,
    );
  });

  it('should create a ride request in PostgreSQL with initial status REQUESTED and null driver', async () => {
    const ride = await ridesService.createRide('rider-101', UserRole.RIDER, validDto);

    expect(mockPrisma.ride.create).toHaveBeenCalledTimes(1);
    expect(ride.id).toBe('mock-pg-ride-123');
    expect(ride.riderId).toBe('rider-101');
    expect(ride.status).toBe(RideStatus.REQUESTED);
    expect(ride.driverProfileId).toBeNull();
    expect(ride.vehicleType).toBe(VehicleType.BIKE);
  });

  it('should propagate database connection errors without creating an in-memory fallback ride', async () => {
    mockPrisma.ride.create.mockRejectedValueOnce(
      new Prisma.PrismaClientInitializationError('Could not connect to PostgreSQL on port 5432', '6.19.3'),
    );

    await expect(
      ridesService.createRide('rider-101', UserRole.RIDER, validDto),
    ).rejects.toThrow(Prisma.PrismaClientInitializationError);
  });

  it('should reject non-rider user roles from creating rides', async () => {
    await expect(
      ridesService.createRide('driver-202', UserRole.DRIVER, validDto),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      ridesService.createRide('admin-303', UserRole.ADMIN, validDto),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.ride.create).not.toHaveBeenCalled();
  });

  it('should fetch rides from PostgreSQL for authenticated rider', async () => {
    await ridesService.getRiderRides('rider-101', UserRole.RIDER);
    expect(mockPrisma.ride.findMany).toHaveBeenCalledWith({
      where: { riderId: 'rider-101' },
      include: { location: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should enforce ownership when fetching ride by ID from PostgreSQL', async () => {
    // Rider 101 can access own ride
    const ride = await ridesService.getRideById('mock-pg-ride-123', 'rider-101', UserRole.RIDER);
    expect(ride.id).toBe('mock-pg-ride-123');

    // Rider 999 cannot access Rider 101's ride
    await expect(
      ridesService.getRideById('mock-pg-ride-123', 'rider-999', UserRole.RIDER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException for non-existent ride ID in PostgreSQL', async () => {
    await expect(
      ridesService.getRideById('non-existent-id', 'rider-101', UserRole.RIDER),
    ).rejects.toThrow(NotFoundException);
  });
});

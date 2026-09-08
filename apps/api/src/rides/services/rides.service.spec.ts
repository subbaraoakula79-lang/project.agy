import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentMethod, RideStatus, UserRole, VehicleType } from '@yatra-seva/shared-types';
import { FareService } from '../../fare/fare.service';
import { MockMapService, MockRoutingService } from '../../providers/mock/mock-map.service';
import { CreateRideDto } from '../dto/create-ride.dto';
import { RidesService } from './rides.service';

describe('RidesService', () => {
  let ridesService: RidesService;
  let fareService: FareService;
  let mockMapService: MockMapService;
  let mockRoutingService: MockRoutingService;

  beforeEach(() => {
    fareService = new FareService();
    mockMapService = new MockMapService();
    mockRoutingService = new MockRoutingService();
    ridesService = new RidesService(fareService, mockMapService, mockRoutingService);
  });

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

  it('should create a ride request with initial status REQUESTED', async () => {
    const ride = await ridesService.createRide('rider-101', UserRole.RIDER, validDto);

    expect(ride).toHaveProperty('id');
    expect(ride.riderId).toBe('rider-101');
    expect(ride.status).toBe(RideStatus.REQUESTED);
    expect(ride.driverProfileId).toBeNull();
    expect(ride.vehicleType).toBe(VehicleType.BIKE);
    expect(ride.estimatedFare).toBeGreaterThan(0);
  });

  it('should reject non-rider user roles from creating rides', async () => {
    await expect(
      ridesService.createRide('driver-202', UserRole.DRIVER, validDto),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      ridesService.createRide('admin-303', UserRole.ADMIN, validDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should list rides created by the authenticated rider', async () => {
    await ridesService.createRide('rider-101', UserRole.RIDER, validDto);
    const rides = await ridesService.getRiderRides('rider-101', UserRole.RIDER);

    expect(rides).toHaveLength(1);
    expect(rides[0]?.riderId).toBe('rider-101');
  });

  it('should enforce ownership when fetching specific ride by ID', async () => {
    const created = await ridesService.createRide('rider-101', UserRole.RIDER, validDto);

    // Same rider can access
    const fetched = await ridesService.getRideById(created.id, 'rider-101', UserRole.RIDER);
    expect(fetched.id).toBe(created.id);

    // Other rider cannot access
    await expect(
      ridesService.getRideById(created.id, 'rider-999', UserRole.RIDER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException for non-existent ride ID', async () => {
    await expect(
      ridesService.getRideById('non-existent-id', 'rider-101', UserRole.RIDER),
    ).rejects.toThrow(NotFoundException);
  });
});

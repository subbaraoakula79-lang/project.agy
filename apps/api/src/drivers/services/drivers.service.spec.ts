import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DriverStatus } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { DriverMatchingService } from './driver-matching.service';
import { DriversService } from './drivers.service';

describe('DriversService', () => {
  let driversService: DriversService;
  let mockPrisma: any;
  let mockRealtime: any;
  let mockMatching: any;

  beforeEach(() => {
    mockPrisma = {
      driverProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      driverLocation: {
        create: jest.fn(),
      },
      driverRideRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      ride: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callbackOrArray) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray(mockPrisma);
        }
        return Promise.all(callbackOrArray);
      }),
    };

    mockRealtime = {
      notifyDriverAccepted: jest.fn(),
      notifyDriverRejected: jest.fn(),
      notifyRideStatusChanged: jest.fn(),
      notifyDriverLocationUpdated: jest.fn(),
      notifyDriverRideOffered: jest.fn(),
    };

    mockMatching = {
      findEligibleDrivers: jest.fn().mockResolvedValue([]),
    };

    driversService = new DriversService(
      mockPrisma as unknown as PrismaService,
      mockRealtime as unknown as RealtimeService,
      mockMatching as unknown as DriverMatchingService,
    );
  });

  describe('Driver Availability', () => {
    it('should allow driver to go ONLINE_AVAILABLE if they have an active registered vehicle', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        userId: 'user-d1',
        status: DriverStatus.OFFLINE,
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      mockPrisma.driverProfile.update.mockResolvedValueOnce({
        id: 'driver-prof-1',
        status: DriverStatus.ONLINE_AVAILABLE,
        currentLatitude: 16.9558,
        currentLongitude: 82.2386,
        lastLocationAt: new Date(),
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      const result = await driversService.setOnline('user-d1');

      expect(result.status).toBe('ONLINE_AVAILABLE');
      expect(result.hasActiveVehicle).toBe(true);
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith({
        where: { id: 'driver-prof-1' },
        data: { status: DriverStatus.ONLINE_AVAILABLE },
        include: expect.any(Object),
      });
    });

    it('should reject going online if driver has no active registered vehicle', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-no-veh',
        userId: 'user-d-no-veh',
        status: DriverStatus.OFFLINE,
        vehicles: [],
      });

      await expect(driversService.setOnline('user-d-no-veh')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should allow driver to go OFFLINE if not on an active ride', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        userId: 'user-d1',
        status: DriverStatus.ONLINE_AVAILABLE,
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      mockPrisma.ride.findFirst.mockResolvedValueOnce(null); // No active ride

      mockPrisma.driverProfile.update.mockResolvedValueOnce({
        id: 'driver-prof-1',
        status: DriverStatus.OFFLINE,
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      const result = await driversService.setOffline('user-d1');

      expect(result.status).toBe('OFFLINE');
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith({
        where: { id: 'driver-prof-1' },
        data: { status: DriverStatus.OFFLINE },
        include: expect.any(Object),
      });
    });

    it('should reject going offline if driver is currently assigned to an active ride', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        userId: 'user-d1',
        status: DriverStatus.BUSY,
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      mockPrisma.ride.findFirst.mockResolvedValueOnce({
        id: 'active-ride-123',
        status: 'DRIVER_ASSIGNED',
      });

      await expect(driversService.setOffline('user-d1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });
  });

  describe('Driver Location', () => {
    it('should update driver location in DriverLocation history and DriverProfile', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        userId: 'user-d1',
      });

      mockPrisma.driverProfile.update.mockResolvedValueOnce({
        id: 'driver-prof-1',
        currentLatitude: 16.9891,
        currentLongitude: 82.2475,
        lastLocationAt: new Date(),
      });

      mockPrisma.ride.findFirst.mockResolvedValueOnce({ id: 'assigned-ride-1' });

      const result = await driversService.updateLocation('user-d1', {
        latitude: 16.9891,
        longitude: 82.2475,
      });

      expect(result.latitude).toBe(16.9891);
      expect(result.longitude).toBe(82.2475);
      expect(mockRealtime.notifyDriverLocationUpdated).toHaveBeenCalledWith('assigned-ride-1', {
        latitude: 16.9891,
        longitude: 82.2475,
      });
    });
  });

  describe('Driver Ride Acceptance & Concurrency', () => {
    it('should accept ride atomically, transition ride to DRIVER_ASSIGNED and driver to BUSY', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'driver-prof-1',
        userId: 'user-d1',
        vehicles: [{ id: 'v-1', isActive: true, make: 'Bajaj', model: 'RE', registrationNumber: 'AP05CD5678' }],
        user: { firstName: 'Suresh', lastName: 'Babu', phoneNumber: '+918000000001' },
      });

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-1',
        status: 'SEARCHING_DRIVER',
        driverProfileId: null,
        riderId: 'rider-1',
      });

      mockPrisma.driverRideRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        rideId: 'ride-1',
        driverProfileId: 'driver-prof-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 20000), // Valid
      });

      mockPrisma.ride.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.ride.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'ride-1',
        status: 'DRIVER_ASSIGNED',
        driverProfileId: 'driver-prof-1',
        riderId: 'rider-1',
        driverProfile: {
          id: 'driver-prof-1',
          user: { firstName: 'Suresh', lastName: 'Babu', phoneNumber: '+918000000001' },
          vehicles: [{ registrationNumber: 'AP05CD5678' }],
        },
      });

      const result = await driversService.acceptRide('user-d1', 'ride-1');

      expect(result.status).toBe('DRIVER_ASSIGNED');
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith({
        where: { id: 'driver-prof-1' },
        data: { status: DriverStatus.BUSY },
      });
      expect(mockRealtime.notifyDriverAccepted).toHaveBeenCalledWith('ride-1', expect.any(Object));
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith('ride-1', 'rider-1', 'DRIVER_ASSIGNED', expect.any(Object));
    });

    it('should prevent race condition: reject duplicate acceptance if ride already assigned to another driver', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'driver-prof-2',
        userId: 'user-d2',
      });

      // Ride was already assigned in a concurrent request
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-1',
        status: 'DRIVER_ASSIGNED',
        driverProfileId: 'driver-prof-1',
      });

      await expect(driversService.acceptRide('user-d2', 'ride-1')).rejects.toThrow(ConflictException);
    });

    it('should reject acceptance if the ride request has expired', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'driver-prof-1',
        userId: 'user-d1',
      });

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-1',
        status: 'SEARCHING_DRIVER',
        driverProfileId: null,
      });

      mockPrisma.driverRideRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        rideId: 'ride-1',
        driverProfileId: 'driver-prof-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 5000), // Expired
      });

      await expect(driversService.acceptRide('user-d1', 'ride-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Driver Ride Rejection & Timeout', () => {
    it('should mark request REJECTED, keep driver available, and attempt next driver', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'driver-prof-1',
        userId: 'user-d1',
      });

      mockPrisma.driverRideRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        rideId: 'ride-1',
        driverProfileId: 'driver-prof-1',
        status: 'PENDING',
      });

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-1',
        status: 'SEARCHING_DRIVER',
        driverProfileId: null,
        location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386, pickupAddress: 'A', dropAddress: 'B' },
        vehicleTypeId: 'AUTO',
        riderId: 'rider-1',
      });

      // Rematching finds next driver
      mockMatching.findEligibleDrivers.mockResolvedValueOnce([
        { driverId: 'driver-prof-2', distanceMeters: 1200 },
      ]);

      mockPrisma.driverRideRequest.create.mockResolvedValueOnce({ id: 'req-2' });

      const result = await driversService.rejectRide('user-d1', 'ride-1');

      expect(result.success).toBe(true);
      expect(mockPrisma.driverRideRequest.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: expect.objectContaining({ status: 'REJECTED' }),
      });
      expect(mockRealtime.notifyDriverRejected).toHaveBeenCalledWith('ride-1', {
        rideId: 'ride-1',
        driverProfileId: 'driver-prof-1',
      });
      // Offered to next driver
      expect(mockRealtime.notifyDriverRideOffered).toHaveBeenCalledWith('driver-prof-2', expect.any(Object));
    });

    it('should transition ride to CANCELLED_NO_DRIVER when all candidates are exhausted', async () => {
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-empty',
        status: 'SEARCHING_DRIVER',
        driverProfileId: null,
        location: { pickupLatitude: 16.9558, pickupLongitude: 82.2386 },
        vehicleTypeId: 'CAB',
        riderId: 'rider-1',
      });

      mockMatching.findEligibleDrivers.mockResolvedValueOnce([]); // No more drivers

      await driversService.attemptNextDriver('ride-empty');

      expect(mockPrisma.ride.update).toHaveBeenCalledWith({
        where: { id: 'ride-empty' },
        data: {
          status: 'CANCELLED_NO_DRIVER',
          cancellationReason: 'No available drivers found nearby',
        },
      });
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        'ride-empty',
        'rider-1',
        'CANCELLED_NO_DRIVER',
        expect.any(Object),
      );
    });
  });
});

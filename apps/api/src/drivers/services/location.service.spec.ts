import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { DriverMatchingService } from './driver-matching.service';
import { DriversService } from './drivers.service';

describe('Location Tracking Unit Tests', () => {
  let service: DriversService;
  let mockPrisma: any;
  let mockRealtime: any;

  beforeEach(() => {
    mockPrisma = {
      driverProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      driverLocation: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      ride: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (arr) => Promise.all(arr)),
    };

    mockRealtime = {
      notifyDriverLocationUpdated: jest.fn(),
    };

    service = new DriversService(
      mockPrisma as unknown as PrismaService,
      mockRealtime as unknown as RealtimeService,
      {} as DriverMatchingService,
    );
  });

  describe('Location Deduplication & Freshness', () => {
    it('should calculate FRESH for recent location within threshold', () => {
      const recent = new Date(Date.now() - 5000); // 5s ago
      const freshness = service.calculateFreshness(recent, 30);
      expect(freshness).toBe('FRESH');
    });

    it('should calculate STALE for location older than threshold', () => {
      const old = new Date(Date.now() - 40000); // 40s ago
      const freshness = service.calculateFreshness(old, 30);
      expect(freshness).toBe('STALE');
    });

    it('should calculate UNAVAILABLE when location is null', () => {
      const freshness = service.calculateFreshness(null, 30);
      expect(freshness).toBe('UNAVAILABLE');
    });

    it('should skip duplicate write if driver moved less than 2m within 5s', async () => {
      const now = new Date();
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'prof-1',
        userId: 'driver-u1',
        currentLatitude: 16.9558,
        currentLongitude: 82.2386,
        lastLocationAt: now,
      });

      const result = await service.updateLocation('driver-u1', {
        latitude: 16.9558001, // tiny move < 0.1 meter
        longitude: 82.2386001,
      });

      expect(mockPrisma.driverLocation.create).not.toHaveBeenCalled();
      expect(result.freshness).toBe('FRESH');
    });

    it('should persist new location with metadata when movement is valid', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'prof-1',
        userId: 'driver-u1',
        currentLatitude: 16.9558,
        currentLongitude: 82.2386,
        lastLocationAt: new Date(Date.now() - 10000),
      });

      mockPrisma.driverLocation.create.mockResolvedValueOnce({
        id: 'loc-1',
        driverProfileId: 'prof-1',
        latitude: 16.9600,
        longitude: 82.2450,
        accuracy: 4.5,
        heading: 90,
        speed: 12.5,
        recordedAt: new Date(),
      });

      mockPrisma.driverProfile.update.mockResolvedValueOnce({
        id: 'prof-1',
        currentLatitude: 16.9600,
        currentLongitude: 82.2450,
        lastLocationAt: new Date(),
      });

      mockPrisma.ride.findFirst.mockResolvedValueOnce({
        id: 'ride-123',
        riderId: 'rider-u1',
      });

      const result = await service.updateLocation('driver-u1', {
        latitude: 16.9600,
        longitude: 82.2450,
        accuracy: 4.5,
        heading: 90,
        speed: 12.5,
      });

      expect(mockPrisma.driverLocation.create).toHaveBeenCalled();
      expect(mockRealtime.notifyDriverLocationUpdated).toHaveBeenCalledWith(
        'ride-123',
        expect.objectContaining({
          latitude: 16.9600,
          longitude: 82.2450,
          accuracy: 4.5,
        }),
      );
      expect(result.freshness).toBe('FRESH');
    });
  });

  describe('getDriverLocationForRide RBAC & Freshness', () => {
    it('should return location for authorized rider', async () => {
      const recorded = new Date();
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-1',
        riderId: 'rider-u1',
        driverProfileId: 'prof-d1',
        driverProfile: {
          currentLatitude: 16.9558,
          currentLongitude: 82.2386,
          lastLocationAt: recorded,
        },
      });

      mockPrisma.driverLocation.findFirst.mockResolvedValueOnce({
        latitude: 16.9558,
        longitude: 82.2386,
        accuracy: 3.2,
        heading: 180,
        speed: 5.0,
        recordedAt: recorded,
      });

      const result = await service.getDriverLocationForRide('ride-1', 'rider-u1', UserRole.RIDER);

      expect(result.freshness).toBe('FRESH');
      expect(result.driverProfileId).toBe('prof-d1');
      expect(result.latitude).toBe(16.9558);
      expect(result.accuracy).toBe(3.2);
    });

    it('should throw ForbiddenException if unauthorized rider attempts access', async () => {
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-1',
        riderId: 'rider-u1', // Authorized is rider-u1
        driverProfileId: 'prof-d1',
      });

      await expect(
        service.getDriverLocationForRide('ride-1', 'attacker-u99', UserRole.RIDER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if ride does not exist', async () => {
      mockPrisma.ride.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.getDriverLocationForRide('non-existent', 'rider-u1', UserRole.RIDER),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

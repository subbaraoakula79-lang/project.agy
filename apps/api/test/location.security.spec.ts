import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';
import { DriversService } from '../src/drivers/services/drivers.service';

describe('Phase 6 Location Security & RBAC Suite', () => {
  let driversService: DriversService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      ride: {
        findUnique: jest.fn(),
      },
      driverProfile: {
        findUnique: jest.fn(),
      },
      driverLocation: {
        findFirst: jest.fn(),
      },
    };

    driversService = new DriversService(
      mockPrisma as any,
      {} as any,
      {} as any,
    );
  });

  describe('IDOR & Scope Isolation', () => {
    it('SECURITY: Rider B must be blocked from fetching driver location for Rider A ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-rider-a',
        riderId: 'rider-user-a',
        driverProfileId: 'driver-prof-1',
      });

      await expect(
        driversService.getDriverLocationForRide(
          'ride-rider-a',
          'rider-user-b', // Unauthorized attacker
          UserRole.RIDER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SECURITY: Unassigned Driver B must be blocked from fetching location for Driver A ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-driver-a',
        riderId: 'rider-user-a',
        driverProfileId: 'driver-prof-a',
      });

      // Driver B's profile
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-b',
        userId: 'driver-user-b',
      });

      await expect(
        driversService.getDriverLocationForRide(
          'ride-driver-a',
          'driver-user-b',
          UserRole.DRIVER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('SECURITY: Valid assigned driver can view their own ride location', async () => {
      const now = new Date();
      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-driver-a',
        riderId: 'rider-user-a',
        driverProfileId: 'driver-prof-a',
        driverProfile: {
          currentLatitude: 16.9558,
          currentLongitude: 82.2386,
          lastLocationAt: now,
        },
      });

      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-a',
        userId: 'driver-user-a',
      });

      mockPrisma.driverLocation.findFirst.mockResolvedValueOnce({
        latitude: 16.9558,
        longitude: 82.2386,
        recordedAt: now,
      });

      const res = await driversService.getDriverLocationForRide(
        'ride-driver-a',
        'driver-user-a',
        UserRole.DRIVER,
      );

      expect(res.driverProfileId).toBe('driver-prof-a');
      expect(res.freshness).toBe('FRESH');
    });
  });
});

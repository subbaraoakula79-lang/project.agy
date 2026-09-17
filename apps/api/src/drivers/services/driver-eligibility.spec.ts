import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriverMatchingService } from './driver-matching.service';
import { DriverStatus, VerificationStatus } from '@yatra-seva/shared-types';

describe('Driver Onboarding & Eligibility Enforcements', () => {
  let driversService: DriversService;
  let matchingService: DriverMatchingService;
  let mockPrisma: any;
  let mockRealtimeService: any;
  let mockNotificationsService: any;
  let mockRoutingService: any;

  beforeEach(() => {
    mockPrisma = {
      driverProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      driverRideRequest: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockRealtimeService = {
      emitDriverLocation: jest.fn(),
    };

    mockNotificationsService = {
      sendPushNotification: jest.fn(),
    };

    mockRoutingService = {
      getRoute: jest.fn().mockResolvedValue({ distanceMeters: 1200, durationSeconds: 240 }),
    };

    driversService = new DriversService(
      mockPrisma,
      mockRealtimeService,
      undefined as any,
      undefined as any,
      mockNotificationsService,
    );

    matchingService = new DriverMatchingService(mockPrisma, mockRoutingService);
  });

  describe('DriversService.setOnline Verification Guards', () => {
    it('should FORBID going online when verificationStatus is PENDING', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-pending',
        userId: 'user-pending',
        verificationStatus: VerificationStatus.PENDING,
        isVerified: false,
        vehicles: [{ id: 'veh-1', isActive: true }],
      });

      await expect(driversService.setOnline('user-pending')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should FORBID going online when verificationStatus is UNDER_REVIEW', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-review',
        userId: 'user-review',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
        isVerified: false,
        vehicles: [{ id: 'veh-1', isActive: true }],
      });

      await expect(driversService.setOnline('user-review')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should FORBID going online when verificationStatus is REJECTED', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-rej',
        userId: 'user-rej',
        verificationStatus: VerificationStatus.REJECTED,
        isVerified: false,
        vehicles: [{ id: 'veh-1', isActive: true }],
      });

      await expect(driversService.setOnline('user-rej')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should FORBID going online when verificationStatus is SUSPENDED', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-susp',
        userId: 'user-susp',
        verificationStatus: VerificationStatus.SUSPENDED,
        isVerified: true,
        vehicles: [{ id: 'veh-1', isActive: true }],
      });

      await expect(driversService.setOnline('user-susp')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should REJECT going online if driver has no registered vehicle, even if APPROVED', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-app-no-veh',
        userId: 'user-app-no-veh',
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        vehicles: [], // No vehicle
      });

      await expect(driversService.setOnline('user-app-no-veh')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('should ALLOW going online when verificationStatus is APPROVED and vehicle is active', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-approved',
        userId: 'user-approved',
        verificationStatus: VerificationStatus.APPROVED,
        isVerified: true,
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      mockPrisma.driverProfile.update.mockResolvedValue({
        id: 'drv-approved',
        status: DriverStatus.ONLINE_AVAILABLE,
        vehicles: [{ id: 'veh-1', isActive: true, vehicleType: { name: 'AUTO' } }],
      });

      const result = await driversService.setOnline('user-approved');
      expect(result.status).toBe('ONLINE_AVAILABLE');
      expect(result.hasActiveVehicle).toBe(true);
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'drv-approved' },
          data: { status: DriverStatus.ONLINE_AVAILABLE },
        }),
      );
    });
  });

  describe('DriverMatchingService Verification Filter', () => {
    it('should strictly query drivers with verificationStatus: APPROVED', async () => {
      mockPrisma.driverProfile.findMany.mockResolvedValue([]);

      await matchingService.findEligibleDrivers({
        pickupLocation: { latitude: 16.989065, longitude: 82.247467 },
        vehicleType: 'AUTO' as any,
        cityId: 'kakinada-city-id',
      });

      expect(mockPrisma.driverProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verificationStatus: 'APPROVED',
            isVerified: true,
            isOnboarded: true,
          }),
        }),
      );
    });
  });
});

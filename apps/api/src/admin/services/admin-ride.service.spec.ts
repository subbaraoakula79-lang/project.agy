import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminRideService } from './admin-ride.service';
import { RideStateMachineService } from '../../rides/services/ride-state-machine.service';
import { DriverStatus, RideStatus } from '@yatra-seva/shared-types';

describe('AdminRideService', () => {
  let service: AdminRideService;
  let mockPrisma: any;
  let mockAuditService: any;
  let mockRealtimeService: any;
  let mockNotificationsService: any;
  let stateMachine: RideStateMachineService;

  beforeEach(() => {
    mockPrisma = {
      ride: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      driverProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      driverRideRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => cb(mockPrisma)),
    };

    mockAuditService = {
      createAuditLog: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    mockRealtimeService = {
      notifyRideStatusChanged: jest.fn(),
      emitRideUpdate: jest.fn(),
    };

    mockNotificationsService = {
      sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
      createAndSendNotification: jest.fn().mockResolvedValue({ success: true }),
    };

    stateMachine = new RideStateMachineService();

    service = new AdminRideService(
      mockPrisma,
      mockAuditService,
      stateMachine,
      mockRealtimeService,
      mockNotificationsService,
    );
  });

  describe('listRides', () => {
    it('should return paginated rides with filter', async () => {
      const mockRides = [{ id: 'ride-1', status: RideStatus.REQUESTED }];
      mockPrisma.ride.findMany.mockResolvedValue(mockRides);
      mockPrisma.ride.count.mockResolvedValue(1);

      const result = await service.listRides({ page: 1, limit: 10, status: 'REQUESTED' });

      expect(result.data).toEqual(mockRides);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getRideDetail', () => {
    it('should throw NotFoundException when ride does not exist', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(null);

      await expect(service.getRideDetail('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return ride detail', async () => {
      const mockRide = { id: 'ride-1', status: RideStatus.REQUESTED };
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);

      const result = await service.getRideDetail('ride-1');
      expect(result).toEqual(mockRide);
    });
  });

  describe('cancelRide (Admin Intervention)', () => {
    it('should allow admin to cancel a ride in REQUESTED status', async () => {
      const mockRide = {
        id: 'ride-1',
        riderId: 'rider-1',
        driverProfileId: null,
        status: RideStatus.REQUESTED,
      };
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.ride.update.mockResolvedValue({
        ...mockRide,
        status: RideStatus.CANCELLED_BY_ADMIN,
      });

      const result = await service.cancelRide('ride-1', 'admin-1', 'Operational emergency');

      expect(result.status).toBe(RideStatus.CANCELLED_BY_ADMIN);
      expect(mockAuditService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RIDE_CANCELLED',
          entityType: 'RIDE',
          entityId: 'ride-1',
          reason: 'Operational emergency',
        }),
        expect.anything(),
      );
    });

    it('should allow admin to cancel ride in DRIVER_ARRIVED status and free assigned driver', async () => {
      const mockRide = {
        id: 'ride-2',
        riderId: 'rider-1',
        driverProfileId: 'drv-prof-1',
        driverProfile: {
          userId: 'driver-user-1',
        },
        status: RideStatus.DRIVER_ARRIVED,
      };
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'drv-prof-1',
        verificationStatus: 'APPROVED',
      });
      mockPrisma.ride.update.mockResolvedValue({
        ...mockRide,
        status: RideStatus.CANCELLED_BY_ADMIN,
      });

      const result = await service.cancelRide('ride-2', 'admin-1', 'Roadblock on pickup street');

      expect(result.status).toBe(RideStatus.CANCELLED_BY_ADMIN);
      // Ensure assigned driver is freed back to ONLINE_AVAILABLE
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'drv-prof-1' },
          data: { status: DriverStatus.ONLINE_AVAILABLE },
        }),
      );
      expect(mockAuditService.createAuditLog).toHaveBeenCalled();
    });

    it('should REJECT admin cancellation if ride is already in RIDE_STARTED', async () => {
      const mockRide = {
        id: 'ride-started',
        riderId: 'rider-1',
        driverProfileId: 'drv-1',
        status: RideStatus.RIDE_STARTED,
      };
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);

      await expect(
        service.cancelRide('ride-started', 'Late cancellation', 'admin-1'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.ride.update).not.toHaveBeenCalled();
    });

    it('should REJECT admin cancellation if ride is already COMPLETED', async () => {
      const mockRide = {
        id: 'ride-done',
        riderId: 'rider-1',
        driverProfileId: 'drv-1',
        status: RideStatus.COMPLETED,
      };
      mockPrisma.ride.findUnique.mockResolvedValue(mockRide);

      await expect(
        service.cancelRide('ride-done', 'Trip ended', 'admin-1'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.ride.update).not.toHaveBeenCalled();
    });
  });
});

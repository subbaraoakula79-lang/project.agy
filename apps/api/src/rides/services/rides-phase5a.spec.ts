import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus, RideStatus, UserRole } from '@yatra-seva/shared-types';
import { DriversService } from '../../drivers/services/drivers.service';
import { RidesService } from './rides.service';
import { RideStateMachineService } from './ride-state-machine.service';

describe('Phase 5A: Active Ride State Machine & Trip Controls', () => {
  let stateMachine: RideStateMachineService;

  beforeEach(() => {
    stateMachine = new RideStateMachineService();
  });

  // ============================================================================
  // 1. STATE MACHINE TRANSITIONS
  // ============================================================================
  describe('RideStateMachineService Transitions', () => {
    it('should validate all legal Phase 5A sequential transitions', () => {
      expect(stateMachine.canTransition('DRIVER_ASSIGNED', 'DRIVER_ARRIVING')).toBe(true);
      expect(stateMachine.canTransition('DRIVER_ARRIVING', 'DRIVER_ARRIVED')).toBe(true);
      expect(stateMachine.canTransition('DRIVER_ARRIVED', 'RIDE_STARTED')).toBe(true);
      expect(stateMachine.canTransition('RIDE_STARTED', 'RIDE_COMPLETED')).toBe(true);
      expect(stateMachine.canTransition('RIDE_COMPLETED', 'PAYMENT_PENDING')).toBe(true);
    });

    it('should preserve existing Phase 4 valid transitions', () => {
      expect(stateMachine.canTransition('REQUESTED', 'SEARCHING_DRIVER')).toBe(true);
      expect(stateMachine.canTransition('SEARCHING_DRIVER', 'DRIVER_ASSIGNED')).toBe(true);
      expect(stateMachine.canTransition('SEARCHING_DRIVER', 'CANCELLED_NO_DRIVER')).toBe(true);
    });

    it('should REJECT illegal Phase 5A skipping and reverse transitions', () => {
      // Skipping states
      expect(stateMachine.canTransition('REQUESTED', 'DRIVER_ARRIVING')).toBe(false);
      expect(stateMachine.canTransition('SEARCHING_DRIVER', 'RIDE_STARTED')).toBe(false);
      expect(stateMachine.canTransition('DRIVER_ASSIGNED', 'DRIVER_ARRIVED')).toBe(false);
      expect(stateMachine.canTransition('DRIVER_ASSIGNED', 'RIDE_STARTED')).toBe(false);
      expect(stateMachine.canTransition('DRIVER_ARRIVING', 'RIDE_STARTED')).toBe(false);
      expect(stateMachine.canTransition('DRIVER_ASSIGNED', 'RIDE_COMPLETED')).toBe(false);

      // Reverse transitions
      expect(stateMachine.canTransition('DRIVER_ARRIVED', 'DRIVER_ARRIVING')).toBe(false);
      expect(stateMachine.canTransition('RIDE_STARTED', 'DRIVER_ARRIVED')).toBe(false);
      expect(stateMachine.canTransition('RIDE_COMPLETED', 'RIDE_STARTED')).toBe(false);
      expect(stateMachine.canTransition('PAYMENT_PENDING', 'RIDE_STARTED')).toBe(false);
      expect(stateMachine.canTransition('PAYMENT_PENDING', 'DRIVER_ASSIGNED')).toBe(false);
    });

    it('should throw ConflictException on invalid transitions in assertValidTransition', () => {
      expect(() =>
        stateMachine.assertValidTransition('DRIVER_ASSIGNED', 'RIDE_STARTED'),
      ).toThrow(ConflictException);

      expect(() =>
        stateMachine.assertValidTransition('REQUESTED', 'DRIVER_ARRIVED'),
      ).toThrow(ConflictException);
    });

    it('should allow idempotent duplicate transition call without error', () => {
      expect(() =>
        stateMachine.assertValidTransition('DRIVER_ARRIVING', 'DRIVER_ARRIVING'),
      ).not.toThrow();
    });
  });

  // ============================================================================
  // 2. CANCELLATION RULES
  // ============================================================================
  describe('Cancellation Rules Policy', () => {
    it('Rider cancellation: allowed in early stages', () => {
      expect(() => stateMachine.assertRiderCanCancel('REQUESTED')).not.toThrow();
      expect(() => stateMachine.assertRiderCanCancel('SEARCHING_DRIVER')).not.toThrow();
      expect(() => stateMachine.assertRiderCanCancel('DRIVER_ASSIGNED')).not.toThrow();
      expect(() => stateMachine.assertRiderCanCancel('DRIVER_ARRIVING')).not.toThrow();
    });

    it('Rider cancellation: restricted after DRIVER_ARRIVED with BadRequestException', () => {
      expect(() => stateMachine.assertRiderCanCancel('DRIVER_ARRIVED')).toThrow(BadRequestException);
    });

    it('Rider cancellation: strictly forbidden after RIDE_STARTED, RIDE_COMPLETED, and PAYMENT_PENDING', () => {
      expect(() => stateMachine.assertRiderCanCancel('RIDE_STARTED')).toThrow(ConflictException);
      expect(() => stateMachine.assertRiderCanCancel('RIDE_COMPLETED')).toThrow(ConflictException);
      expect(() => stateMachine.assertRiderCanCancel('PAYMENT_PENDING')).toThrow(ConflictException);
      expect(() => stateMachine.assertRiderCanCancel('COMPLETED')).toThrow(ConflictException);
    });

    it('Driver cancellation: allowed before ride start', () => {
      expect(() => stateMachine.assertDriverCanCancel('DRIVER_ASSIGNED')).not.toThrow();
      expect(() => stateMachine.assertDriverCanCancel('DRIVER_ARRIVING')).not.toThrow();
      expect(() => stateMachine.assertDriverCanCancel('DRIVER_ARRIVED')).not.toThrow();
    });

    it('Driver cancellation: strictly forbidden after ride start', () => {
      expect(() => stateMachine.assertDriverCanCancel('RIDE_STARTED')).toThrow(ConflictException);
      expect(() => stateMachine.assertDriverCanCancel('RIDE_COMPLETED')).toThrow(ConflictException);
      expect(() => stateMachine.assertDriverCanCancel('PAYMENT_PENDING')).toThrow(ConflictException);
      expect(() => stateMachine.assertDriverCanCancel('COMPLETED')).toThrow(ConflictException);
    });
  });

  // ============================================================================
  // 3. DRIVERS SERVICE: ACTIVE TRIP CONTROLS
  // ============================================================================
  describe('DriversService Active Trip Controls', () => {
    let mockPrisma: any;
    let mockRealtime: any;
    let driversService: DriversService;

    const driverUserId = 'driver-user-1';
    const driverProfileId = 'driver-prof-1';
    const otherDriverUserId = 'driver-user-2';
    const otherDriverProfileId = 'driver-prof-2';
    const rideId = 'ride-test-1';
    const riderId = 'rider-user-1';

    beforeEach(() => {
      mockPrisma = {
        driverProfile: {
          findUnique: jest.fn().mockImplementation(({ where }: any) => {
            if (where.userId === driverUserId) {
              return Promise.resolve({ id: driverProfileId, userId: driverUserId, status: DriverStatus.BUSY });
            }
            if (where.userId === otherDriverUserId) {
              return Promise.resolve({ id: otherDriverProfileId, userId: otherDriverUserId, status: DriverStatus.ONLINE_AVAILABLE });
            }
            return Promise.resolve(null);
          }),
          update: jest.fn().mockResolvedValue({ id: driverProfileId, status: DriverStatus.BUSY }),
        },
        ride: {
          findUnique: jest.fn(),
          updateMany: jest.fn(),
          update: jest.fn(),
          findFirst: jest.fn(),
        },
        $transaction: jest.fn((cb: any) => cb(mockPrisma)),
      };

      mockRealtime = {
        notifyRideStatusChanged: jest.fn(),
      };

      driversService = new DriversService(
        mockPrisma,
        mockRealtime,
        {} as any,
        stateMachine,
      );
    });

    // --- DRIVER_ARRIVING ---
    it('markArriving: succeeds for assigned driver and transitions to DRIVER_ARRIVING', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'DRIVER_ASSIGNED',
      });
      mockPrisma.ride.updateMany.mockResolvedValue({ count: 1 });

      await driversService.markArriving(driverUserId, rideId);

      expect(mockPrisma.ride.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: rideId, driverProfileId, status: 'DRIVER_ASSIGNED' },
          data: expect.objectContaining({
            status: 'DRIVER_ARRIVING',
            arrivingAt: expect.any(Date),
          }),
        }),
      );
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        rideId,
        riderId,
        'DRIVER_ARRIVING',
        expect.objectContaining({ status: 'DRIVER_ARRIVING' }),
      );
    });

    it('markArriving: REJECTS unrelated driver with 403 Forbidden', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId, // assigned to driver-prof-1
        riderId,
        status: 'DRIVER_ASSIGNED',
      });

      // otherDriverUserId tries to mark arriving
      await expect(driversService.markArriving(otherDriverUserId, rideId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('markArriving: is idempotent if already DRIVER_ARRIVING', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'DRIVER_ARRIVING',
      });

      const result = await driversService.markArriving(driverUserId, rideId);
      expect(mockPrisma.ride.updateMany).not.toHaveBeenCalled();
    });

    // --- DRIVER_ARRIVED ---
    it('markArrived: succeeds when current status is DRIVER_ARRIVING', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'DRIVER_ARRIVING',
      });
      mockPrisma.ride.updateMany.mockResolvedValue({ count: 1 });

      await driversService.markArrived(driverUserId, rideId);

      expect(mockPrisma.ride.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: rideId, driverProfileId, status: { in: ['DRIVER_ARRIVING', 'DRIVER_EN_ROUTE'] } },
          data: expect.objectContaining({
            status: 'DRIVER_ARRIVED',
            driverArrivedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        rideId,
        riderId,
        'DRIVER_ARRIVED',
        expect.objectContaining({ status: 'DRIVER_ARRIVED' }),
      );
    });

    it('markArrived: REJECTS jumping directly from DRIVER_ASSIGNED without arriving first', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'DRIVER_ASSIGNED', // Haven't arrived or started arriving
      });

      await expect(driversService.markArrived(driverUserId, rideId)).rejects.toThrow(
        ConflictException,
      );
    });

    // --- RIDE_STARTED ---
    it('startRide: succeeds when DRIVER_ARRIVED and sets startedAt timestamp', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'DRIVER_ARRIVED',
      });
      mockPrisma.ride.updateMany.mockResolvedValue({ count: 1 });

      await driversService.startRide(driverUserId, rideId);

      expect(mockPrisma.ride.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: rideId, driverProfileId, status: 'DRIVER_ARRIVED' },
          data: expect.objectContaining({
            status: 'RIDE_STARTED',
            startedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        rideId,
        riderId,
        'RIDE_STARTED',
        expect.objectContaining({ status: 'RIDE_STARTED' }),
      );
    });

    it('startRide: REJECTS starting before driver has arrived', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'DRIVER_ARRIVING',
      });

      await expect(driversService.startRide(driverUserId, rideId)).rejects.toThrow(
        ConflictException,
      );
    });

    // --- RIDE_COMPLETED -> PAYMENT_PENDING ---
    it('completeRide: transitions RIDE_STARTED -> PAYMENT_PENDING and driver remains BUSY', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'RIDE_STARTED',
      });
      mockPrisma.ride.updateMany.mockResolvedValue({ count: 1 });

      await driversService.completeRide(driverUserId, rideId);

      expect(mockPrisma.ride.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: rideId, driverProfileId, status: { in: ['RIDE_STARTED', 'RIDE_IN_PROGRESS'] } },
          data: expect.objectContaining({
            status: 'PAYMENT_PENDING',
            completedAt: expect.any(Date),
          }),
        }),
      );

      // INVARIANT: Driver must remain BUSY while payment is pending
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith({
        where: { id: driverProfileId },
        data: { status: DriverStatus.BUSY },
      });

      // Realtime notifications for both completion and payment pending
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        rideId,
        riderId,
        'RIDE_COMPLETED',
        expect.objectContaining({ status: 'RIDE_COMPLETED' }),
      );
      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        rideId,
        riderId,
        'PAYMENT_PENDING',
        expect.objectContaining({ status: 'PAYMENT_PENDING' }),
      );
    });

    it('completeRide: DOES NOT mark ride COMPLETED (Phase 5B boundary strictly maintained)', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        driverProfileId,
        riderId,
        status: 'RIDE_STARTED',
      });
      mockPrisma.ride.updateMany.mockResolvedValue({ count: 1 });

      await driversService.completeRide(driverUserId, rideId);

      const updateCall = mockPrisma.ride.updateMany.mock.calls[0][0];
      expect(updateCall.data.status).toBe('PAYMENT_PENDING');
      expect(updateCall.data.status).not.toBe('COMPLETED');
    });

    // --- DRIVER OFFLINE INVARIANT ---
    it('setOffline: REJECTS driver going offline while in active ride or PAYMENT_PENDING', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: driverProfileId,
        userId: driverUserId,
        vehicles: [],
      });
      mockPrisma.ride.findFirst.mockResolvedValue({
        id: rideId,
        status: 'PAYMENT_PENDING',
      });

      await expect(driversService.setOffline(driverUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    // --- CONCURRENCY / IDEMPOTENCY ---
    it('concurrency: simultaneous startRide calls are safe', async () => {
      let currentStatus = 'DRIVER_ARRIVED';
      mockPrisma.ride.findUnique.mockImplementation(() =>
        Promise.resolve({ id: rideId, driverProfileId, riderId, status: currentStatus }),
      );
      mockPrisma.ride.updateMany.mockImplementation(() => {
        if (currentStatus === 'DRIVER_ARRIVED') {
          currentStatus = 'RIDE_STARTED';
          return Promise.resolve({ count: 1 });
        }
        return Promise.resolve({ count: 0 });
      });

      // Call 1 succeeds
      const result1 = await driversService.startRide(driverUserId, rideId);
      expect(result1?.status).toBe('RIDE_STARTED');

      // Call 2 (concurrent second invocation sees updated state and returns safely)
      const result2 = await driversService.startRide(driverUserId, rideId);
      expect(result2?.status).toBe('RIDE_STARTED');
    });
  });

  // ============================================================================
  // 4. RIDES SERVICE: ACTIVE QUERY & RIDER CANCELLATION
  // ============================================================================
  describe('RidesService Active Ride & Cancellation', () => {
    let mockPrisma: any;
    let mockRealtime: any;
    let ridesService: RidesService;

    const riderUserId = 'rider-1';
    const otherRiderUserId = 'rider-2';
    const driverUserId = 'driver-1';
    const driverProfileId = 'driver-prof-1';
    const rideId = 'ride-1';

    beforeEach(() => {
      mockPrisma = {
        ride: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        driverProfile: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        driverRideRequest: {
          updateMany: jest.fn(),
        },
        $transaction: jest.fn((cb: any) => cb(mockPrisma)),
      };

      mockRealtime = {
        notifyRideStatusChanged: jest.fn(),
      };

      ridesService = new RidesService(
        mockPrisma,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockRealtime,
        stateMachine,
      );
    });

    it('getActiveRide: returns active ride for authenticated rider', async () => {
      mockPrisma.ride.findFirst.mockResolvedValue({
        id: rideId,
        riderId: riderUserId,
        status: 'DRIVER_ARRIVING',
        location: { pickupAddress: 'Kakinada Station', dropAddress: 'Beach Road' },
      });

      const result = await ridesService.getActiveRide(riderUserId, UserRole.RIDER);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(rideId);
      expect(result?.status).toBe(RideStatus.DRIVER_ARRIVING);
    });

    it('getActiveRide: returns null when no active ride exists', async () => {
      mockPrisma.ride.findFirst.mockResolvedValue(null);

      const result = await ridesService.getActiveRide(riderUserId, UserRole.RIDER);
      expect(result).toBeNull();
    });

    it('cancelRiderRide: rider cancels while DRIVER_ASSIGNED and frees driver', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        riderId: riderUserId,
        driverProfileId,
        status: 'DRIVER_ASSIGNED',
        location: {},
      });
      mockPrisma.ride.update.mockResolvedValue({
        id: rideId,
        riderId: riderUserId,
        status: RideStatus.CANCELLED_BY_RIDER,
        location: {},
      });

      await ridesService.cancelRiderRide(riderUserId, rideId, 'Change of plans');

      // Driver is freed to ONLINE_AVAILABLE
      expect(mockPrisma.driverProfile.update).toHaveBeenCalledWith({
        where: { id: driverProfileId },
        data: { status: DriverStatus.ONLINE_AVAILABLE },
      });

      expect(mockRealtime.notifyRideStatusChanged).toHaveBeenCalledWith(
        rideId,
        riderUserId,
        RideStatus.CANCELLED_BY_RIDER,
        expect.objectContaining({ reason: 'Change of plans' }),
      );
    });

    it('cancelRiderRide: REJECTS rider cancellation after driver has arrived', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        riderId: riderUserId,
        driverProfileId,
        status: 'DRIVER_ARRIVED',
      });

      await expect(ridesService.cancelRiderRide(riderUserId, rideId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('cancelRiderRide: REJECTS rider cancellation after ride has started', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        riderId: riderUserId,
        driverProfileId,
        status: 'RIDE_STARTED',
      });

      await expect(ridesService.cancelRiderRide(riderUserId, rideId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('cancelRiderRide: REJECTS unrelated rider from cancelling someone else\'s ride', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue({
        id: rideId,
        riderId: riderUserId,
        status: 'DRIVER_ASSIGNED',
      });

      await expect(ridesService.cancelRiderRide(otherRiderUserId, rideId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@yatra-seva/shared-types';
import { DriversService } from '../drivers/services/drivers.service';
import { RidesGateway } from './rides.gateway';

describe('Phase 4.1 Security, Concurrency & Invariant Audit', () => {
  // ─────────────────────────────────────────────────────────────
  // 1. REALTIME AUTHENTICATION & PARTICIPANT ROOM PROTECTION
  // ─────────────────────────────────────────────────────────────
  describe('Realtime Gateway Room Security', () => {
    let gateway: RidesGateway;
    let mockTokenService: any;
    let mockPrisma: any;

    beforeEach(() => {
      mockTokenService = {
        verifyAccessToken: jest.fn(),
      };
      mockPrisma = {
        ride: {
          findUnique: jest.fn(),
        },
        driverProfile: {
          findUnique: jest.fn(),
        },
        driverRideRequest: {
          findFirst: jest.fn(),
        },
      };

      gateway = new RidesGateway(mockTokenService, mockPrisma);
      gateway.server = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      } as any;
    });

    it('should reject unauthenticated socket connection', async () => {
      const mockSocket: any = {
        id: 'sock-1',
        handshake: { headers: {}, auth: {}, query: {} },
        disconnect: jest.fn(),
        join: jest.fn(),
      };

      await gateway.handleConnection(mockSocket);
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.user).toBeUndefined();
    });

    it('should authenticate socket with valid JWT and auto-join private user room', async () => {
      const mockSocket: any = {
        id: 'sock-2',
        handshake: {
          headers: {},
          auth: { token: 'valid-rider-token' },
          query: {},
        },
        disconnect: jest.fn(),
        join: jest.fn(),
      };

      mockTokenService.verifyAccessToken.mockResolvedValueOnce({
        sub: 'rider-123',
        role: UserRole.RIDER,
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.user).toEqual({ userId: 'rider-123', role: UserRole.RIDER });
      expect(mockSocket.join).toHaveBeenCalledWith('user:rider-123');
      // Verify broad role broadcast room is NOT joined
      expect(mockSocket.join).not.toHaveBeenCalledWith('role:RIDER');
    });

    it('should auto-join driver room for authenticated driver', async () => {
      const mockSocket: any = {
        id: 'sock-driver',
        handshake: {
          headers: { authorization: 'Bearer valid-driver-token' },
          auth: {},
          query: {},
        },
        disconnect: jest.fn(),
        join: jest.fn(),
      };

      mockTokenService.verifyAccessToken.mockResolvedValueOnce({
        sub: 'driver-user-1',
        role: UserRole.DRIVER,
      });

      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('user:driver-user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('driver:driver-prof-1');
      expect(mockSocket.user.driverProfileId).toBe('driver-prof-1');
    });

    it('SECURITY: should block malicious/unrelated client from joining another user ride room', async () => {
      const client: any = {
        user: { userId: 'intruder-rider', role: UserRole.RIDER },
        join: jest.fn(),
      };

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'victim-ride-1',
        riderId: 'legit-rider',
        driverProfileId: 'assigned-driver-prof',
      });

      const res = await gateway.handleJoinRide(client, { rideId: 'victim-ride-1' });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Forbidden: You are not a participant in this ride/);
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should allow legitimate rider to join their own ride room', async () => {
      const client: any = {
        user: { userId: 'legit-rider', role: UserRole.RIDER },
        join: jest.fn(),
      };

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'legit-ride-1',
        riderId: 'legit-rider',
        driverProfileId: 'some-driver',
      });

      const res = await gateway.handleJoinRide(client, { rideId: 'legit-ride-1' });

      expect(res.success).toBe(true);
      expect(client.join).toHaveBeenCalledWith('ride:legit-ride-1');
    });

    it('should allow legitimately assigned driver to join ride room', async () => {
      const client: any = {
        user: { userId: 'driver-user-1', role: UserRole.DRIVER, driverProfileId: 'driver-prof-1' },
        join: jest.fn(),
      };

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'legit-ride-1',
        riderId: 'legit-rider',
        driverProfileId: 'driver-prof-1',
      });

      const res = await gateway.handleJoinRide(client, { rideId: 'legit-ride-1' });

      expect(res.success).toBe(true);
      expect(client.join).toHaveBeenCalledWith('ride:legit-ride-1');
    });

    it('SECURITY: should block driver from spoofing and subscribing to another driver room', async () => {
      const client: any = {
        user: { userId: 'driver-user-1', role: UserRole.DRIVER, driverProfileId: 'driver-prof-1' },
        join: jest.fn(),
      };

      // Attacker tries to join victim driver room
      const res = await gateway.handleJoinDriver(client, { driverProfileId: 'victim-driver-prof-2' });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Forbidden: You can only subscribe to your own driver room/);
      expect(client.join).not.toHaveBeenCalledWith('driver:victim-driver-prof-2');
    });

    it('SECURITY: should forbid RIDER from joining any driver room', async () => {
      const client: any = {
        user: { userId: 'rider-user-1', role: UserRole.RIDER },
        join: jest.fn(),
      };

      const res = await gateway.handleJoinDriver(client, { driverProfileId: 'driver-prof-1' });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Forbidden');
      expect(client.join).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DRIVER ACCEPTANCE CONCURRENCY
  // ─────────────────────────────────────────────────────────────
  describe('Driver Acceptance Concurrency Guard', () => {
    let driversService: DriversService;
    let mockPrisma: any;
    let mockRealtimeService: any;
    let mockMatchingService: any;

    beforeEach(() => {
      mockPrisma = {
        driverProfile: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        driverRideRequest: {
          findUnique: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        ride: {
          findUnique: jest.fn(),
          updateMany: jest.fn(),
          findUniqueOrThrow: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
      };

      mockRealtimeService = {
        notifyDriverAccepted: jest.fn(),
        notifyRideStatusChanged: jest.fn(),
      };
      mockMatchingService = {
        findEligibleDrivers: jest.fn(),
      };

      driversService = new DriversService(mockPrisma, mockRealtimeService, mockMatchingService);
    });

    it('should ensure competing driver receives ConflictException when ride was already taken', async () => {
      // Setup: Driver 2 tries to accept a ride that Driver 1 already took
      mockPrisma.driverProfile.findUnique.mockResolvedValue({
        id: 'driver-prof-2',
        vehicles: [{ id: 'v2', isActive: true, vehicleType: { name: 'BIKE' } }],
      });

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-race-1',
        status: 'SEARCHING_DRIVER',
        driverProfileId: null,
      });

      mockPrisma.driverRideRequest.findUnique.mockResolvedValueOnce({
        id: 'req-2',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30000),
      });

      // Atomic update returns count: 0 because Driver 1 won the race
      mockPrisma.ride.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        driversService.acceptRide('driver-user-2', 'ride-race-1'),
      ).rejects.toThrow(ConflictException);

      // Verify Driver 2's request was NOT accepted and Driver 2 did not become BUSY
      expect(mockPrisma.driverRideRequest.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ACCEPTED' }) }),
      );
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'BUSY' } }),
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DRIVER & RIDE STATE INVARIANTS
  // ─────────────────────────────────────────────────────────────
  describe('Driver & Ride State Invariants', () => {
    let driversService: DriversService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        driverProfile: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        ride: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
        },
        driverRideRequest: {
          findUnique: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
      };

      driversService = new DriversService(mockPrisma, {} as any, {} as any);
    });

    it('INVARIANT: driver cannot go OFFLINE while on active assigned ride', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        vehicles: [{ id: 'v1', isActive: true, vehicleType: { name: 'BIKE' } }],
      });

      // Active assigned ride exists
      mockPrisma.ride.findFirst.mockResolvedValueOnce({
        id: 'active-ride-1',
        status: 'DRIVER_ASSIGNED',
        driverProfileId: 'driver-prof-1',
      });

      await expect(driversService.setOffline('driver-user-1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('INVARIANT: driver cannot go ONLINE_AVAILABLE without an active registered vehicle', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-no-veh',
        vehicles: [], // No active vehicles
      });

      await expect(driversService.setOnline('driver-user-no-veh')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.driverProfile.update).not.toHaveBeenCalled();
    });

    it('INVARIANT: driver cannot accept CANCELLED_NO_DRIVER ride', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        vehicles: [{ id: 'v1', isActive: true, vehicleType: { name: 'BIKE' } }],
      });

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-cancelled',
        status: 'CANCELLED_NO_DRIVER',
        driverProfileId: null,
      });

      await expect(driversService.acceptRide('driver-user-1', 'ride-cancelled')).rejects.toThrow(
        ConflictException,
      );
    });

    it('INVARIANT: driver cannot accept COMPLETED ride', async () => {
      mockPrisma.driverProfile.findUnique.mockResolvedValueOnce({
        id: 'driver-prof-1',
        vehicles: [{ id: 'v1', isActive: true, vehicleType: { name: 'BIKE' } }],
      });

      mockPrisma.ride.findUnique.mockResolvedValueOnce({
        id: 'ride-completed',
        status: 'COMPLETED',
        driverProfileId: 'other-driver',
      });

      await expect(driversService.acceptRide('driver-user-1', 'ride-completed')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});

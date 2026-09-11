// Mock modules that have unresolvable dependencies in the test environment
jest.mock('../realtime/realtime.service', () => ({
  RealtimeService: jest.fn().mockImplementation(() => ({
    notifyRideStatusChanged: jest.fn(),
    emitToUser: jest.fn(),
    emitToRide: jest.fn(),
    emitToDriver: jest.fn(),
  })),
}));

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DriverStatus, PaymentMethod, PaymentStatus, RideStatus, UserRole } from '@yatra-seva/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PAYMENT_STATE_TRANSITIONS, PaymentStateMachineService } from './payment-state-machine.service';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';

describe('PaymentStateMachineService', () => {
  let service: PaymentStateMachineService;

  beforeEach(() => {
    service = new PaymentStateMachineService();
  });

  it('should allow valid transition from PENDING to SUCCEEDED', () => {
    expect(service.canTransition(PaymentStatus.PENDING, PaymentStatus.SUCCEEDED)).toBe(true);
  });

  it('should allow valid transition from PENDING to PROCESSING', () => {
    expect(service.canTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING)).toBe(true);
  });

  it('should allow valid transition from PROCESSING to SUCCEEDED', () => {
    expect(service.canTransition(PaymentStatus.PROCESSING, PaymentStatus.SUCCEEDED)).toBe(true);
  });

  it('should allow retry transition from FAILED to PROCESSING', () => {
    expect(service.canTransition(PaymentStatus.FAILED, PaymentStatus.PROCESSING)).toBe(true);
  });

  it('should reject invalid transition from SUCCEEDED to PENDING', () => {
    expect(service.canTransition(PaymentStatus.SUCCEEDED, PaymentStatus.PENDING)).toBe(false);
    expect(() => service.assertValidTransition(PaymentStatus.SUCCEEDED, PaymentStatus.PENDING)).toThrow(ConflictException);
  });

  it('should reject invalid transition from CANCELLED to SUCCEEDED', () => {
    expect(service.canTransition(PaymentStatus.CANCELLED, PaymentStatus.SUCCEEDED)).toBe(false);
  });

  it('should identify terminal states correctly', () => {
    expect(service.isTerminal(PaymentStatus.SUCCEEDED)).toBe(true);
    expect(service.isTerminal(PaymentStatus.CANCELLED)).toBe(true);
    expect(service.isTerminal(PaymentStatus.PENDING)).toBe(false);
  });
});

describe('PaymentsService Unit Tests', () => {
  let service: PaymentsService;
  let prisma: any;

  const mockRide = {
    id: 'ride-101',
    riderId: 'rider-1',
    driverProfileId: 'driver-prof-1',
    status: RideStatus.PAYMENT_PENDING,
    estimatedFare: 150,
    actualFare: 150,
    paymentMethod: 'CASH',
    payment: null as any,
    completedAt: null,
  };

  const mockDriverProfile = {
    id: 'driver-prof-1',
    userId: 'driver-user-1',
    status: DriverStatus.BUSY,
  };

  beforeEach(async () => {
    const mockPrisma = {
      ride: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      driverProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    // Make $transaction execute the callback with the same prisma mock
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockPrisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PaymentStateMachineService,
        MockPaymentProvider,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RealtimeService,
          useValue: {
            notifyRideStatusChanged: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
  });

  it('should retrieve payment and auto-create PENDING payment record if missing', async () => {
    prisma.ride.findUnique.mockResolvedValue(mockRide);
    prisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      rideId: 'ride-101',
      amount: 150,
      status: PaymentStatus.PENDING,
    });

    const payment = await service.getPaymentByRideId('ride-101', 'rider-1', UserRole.RIDER);
    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(prisma.payment.create).toHaveBeenCalled();
  });

  it('should enforce rider ownership check on getPaymentByRideId', async () => {
    prisma.ride.findUnique.mockResolvedValue(mockRide);
    await expect(
      service.getPaymentByRideId('ride-101', 'unauthorized-rider', UserRole.RIDER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should execute cash confirmation, mark ride COMPLETED and unlock driver to ONLINE_AVAILABLE', async () => {
    prisma.driverProfile.findUnique.mockResolvedValue(mockDriverProfile);
    prisma.ride.findUnique.mockResolvedValue(mockRide);
    prisma.payment.upsert.mockResolvedValue({
      id: 'pay-cash-1',
      rideId: 'ride-101',
      status: PaymentStatus.SUCCEEDED,
      method: PaymentMethod.CASH,
    });

    const result = await service.confirmCashPayment('ride-101', 'driver-user-1');

    expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    expect(prisma.ride.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ride-101' },
        data: expect.objectContaining({ status: RideStatus.COMPLETED }),
      }),
    );
    expect(prisma.driverProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'driver-prof-1' },
        data: expect.objectContaining({ status: DriverStatus.ONLINE_AVAILABLE }),
      }),
    );
  });

  it('should execute UPI confirmation, transition payment to SUCCEEDED and release driver', async () => {
    const rideWithUpiPayment = {
      ...mockRide,
      payment: {
        id: 'pay-upi-1',
        rideId: 'ride-101',
        status: PaymentStatus.PROCESSING,
        method: PaymentMethod.UPI,
        providerPaymentId: null,
      },
    };

    prisma.ride.findUnique.mockResolvedValue(rideWithUpiPayment);
    prisma.payment.update.mockResolvedValue({
      id: 'pay-upi-1',
      status: PaymentStatus.SUCCEEDED,
      method: PaymentMethod.UPI,
    });

    const result = await service.confirmUpiPayment('ride-101', 'rider-1');

    expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    expect(prisma.driverProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: DriverStatus.ONLINE_AVAILABLE },
      }),
    );
  });

  it('should handle mock UPI failure and leave driver BUSY', async () => {
    const rideWithUpiPayment = {
      ...mockRide,
      payment: {
        id: 'pay-upi-2',
        rideId: 'ride-101',
        status: PaymentStatus.PROCESSING,
        method: PaymentMethod.UPI,
      },
    };

    prisma.ride.findUnique.mockResolvedValue(rideWithUpiPayment);
    prisma.payment.update.mockResolvedValue({
      id: 'pay-upi-2',
      status: PaymentStatus.FAILED,
      failureReason: 'Simulated UPI transaction failure',
    });

    const result = await service.confirmUpiPayment('ride-101', 'rider-1', { simulateFailure: true });

    expect(result.status).toBe(PaymentStatus.FAILED);
    // Driver should NOT be unlocked on failure
    expect(prisma.driverProfile.update).not.toHaveBeenCalled();
  });
});

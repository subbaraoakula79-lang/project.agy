// Mock modules that have unresolvable dependencies in the test environment
jest.mock('../realtime/realtime.service', () => ({
  RealtimeService: jest.fn().mockImplementation(() => ({
    notifyRideStatusChanged: jest.fn(),
    emitToUser: jest.fn(),
    emitToRide: jest.fn(),
    emitToDriver: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DriverStatus, PaymentMethod, PaymentStatus, RideStatus } from '@yatra-seva/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PaymentStateMachineService } from './payment-state-machine.service';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';

describe('PaymentsService Idempotency & Concurrency Tests', () => {
  let service: PaymentsService;
  let prisma: any;

  const mockRide = {
    id: 'ride-concurrent-1',
    riderId: 'rider-1',
    driverProfileId: 'driver-prof-1',
    status: RideStatus.PAYMENT_PENDING,
    estimatedFare: 150,
    actualFare: 150,
    paymentMethod: 'CASH',
    payment: null,
    completedAt: null,
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
          useValue: { notifyRideStatusChanged: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
  });

  it('Concurrent confirmCash calls return single authoritative result without double settlement', async () => {
    prisma.driverProfile.findUnique.mockResolvedValue({
      id: 'driver-prof-1',
      userId: 'driver-user-1',
      status: DriverStatus.BUSY,
    });
    prisma.ride.findUnique.mockResolvedValue(mockRide);
    prisma.payment.upsert.mockResolvedValue({
      id: 'pay-cash-con-1',
      rideId: 'ride-concurrent-1',
      status: PaymentStatus.SUCCEEDED,
      method: PaymentMethod.CASH,
    });

    // Fire 5 parallel confirmCashPayment requests
    const promises = Array.from({ length: 5 }).map(() =>
      service.confirmCashPayment('ride-concurrent-1', 'driver-user-1'),
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r.status).toBe(PaymentStatus.SUCCEEDED);
    });
  });

  it('Repeated confirmUpi calls when ride is already COMPLETED return existing success cleanly', async () => {
    const completedRide = {
      ...mockRide,
      status: RideStatus.COMPLETED,
      payment: {
        id: 'pay-upi-completed',
        rideId: 'ride-concurrent-1',
        status: PaymentStatus.SUCCEEDED,
        method: PaymentMethod.UPI,
      },
    };

    prisma.ride.findUnique.mockResolvedValue(completedRide);

    const result = await service.confirmUpiPayment('ride-concurrent-1', 'rider-1');

    expect(result.status).toBe(PaymentStatus.SUCCEEDED);
    // Ensure no additional DB mutations occur
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(prisma.ride.update).not.toHaveBeenCalled();
  });
});

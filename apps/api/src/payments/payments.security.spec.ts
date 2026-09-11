// Mock modules that have unresolvable dependencies in the test environment
jest.mock('../realtime/realtime.service', () => ({
  RealtimeService: jest.fn().mockImplementation(() => ({
    notifyRideStatusChanged: jest.fn(),
    emitToUser: jest.fn(),
    emitToRide: jest.fn(),
    emitToDriver: jest.fn(),
  })),
}));

import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DriverStatus, PaymentStatus, RideStatus, UserRole } from '@yatra-seva/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PaymentStateMachineService } from './payment-state-machine.service';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';

describe('PaymentsService Security & RBAC Isolation Tests', () => {
  let service: PaymentsService;
  let prisma: any;

  const sampleRide = {
    id: 'ride-secure-1',
    riderId: 'rider-alice',
    driverProfileId: 'driver-bob-prof',
    status: RideStatus.PAYMENT_PENDING,
    estimatedFare: 200,
    actualFare: 200,
    paymentMethod: 'CASH',
    payment: { id: 'pay-1', status: PaymentStatus.PENDING },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PaymentStateMachineService,
        MockPaymentProvider,
        {
          provide: PrismaService,
          useValue: {
            ride: {
              findUnique: jest.fn(),
            },
            driverProfile: {
              findUnique: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
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

  it('Rider B cannot view payment status for Rider A ride (IDOR Protection)', async () => {
    prisma.ride.findUnique.mockResolvedValue(sampleRide);

    await expect(
      service.getPaymentByRideId('ride-secure-1', 'rider-eve', UserRole.RIDER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Driver X cannot confirm cash payment for Driver Y ride', async () => {
    prisma.driverProfile.findUnique.mockResolvedValue({
      id: 'driver-malicious-prof',
      userId: 'driver-malicious-user',
      status: DriverStatus.BUSY,
    });
    prisma.ride.findUnique.mockResolvedValue(sampleRide);

    await expect(
      service.confirmCashPayment('ride-secure-1', 'driver-malicious-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('Rider B cannot initiate payment for Rider A ride', async () => {
    prisma.ride.findUnique.mockResolvedValue(sampleRide);

    await expect(
      service.initiatePayment('ride-secure-1', 'rider-eve'),
    ).rejects.toThrow(ForbiddenException);
  });
});

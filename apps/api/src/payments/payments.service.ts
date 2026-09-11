import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DriverStatus, PaymentMethod, PaymentStatus, RideStatus, UserRole } from '@yatra-seva/shared-types';
import { PrismaService } from '../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RideStateMachineService } from '../rides/services/ride-state-machine.service';
import { PaymentStateMachineService } from './payment-state-machine.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockPaymentProvider: MockPaymentProvider,
    private readonly paymentStateMachine: PaymentStateMachineService,
    @Optional() private readonly realtimeService?: RealtimeService,
    @Optional() private readonly rideStateMachine?: RideStateMachineService,
  ) {}

  /**
   * Get payment details for a specific ride with RBAC & ownership checks.
   */
  async getPaymentByRideId(rideId: string, requestingUserId: string, userRole: UserRole) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { payment: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    // Ownership check for Rider
    if (userRole === UserRole.RIDER && ride.riderId !== requestingUserId) {
      throw new ForbiddenException('Access denied: You can only access payment for your own ride');
    }

    // Ownership check for Driver
    if (userRole === UserRole.DRIVER) {
      const driverProfile = await this.prisma.driverProfile.findUnique({
        where: { userId: requestingUserId },
      });

      if (!driverProfile || ride.driverProfileId !== driverProfile.id) {
        throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
      }
    }

    // If payment doesn't exist yet, auto-create a initial PENDING payment record
    if (!ride.payment) {
      const amount = ride.actualFare ?? ride.estimatedFare ?? 0;
      const method = (ride.paymentMethod as PaymentMethod) || PaymentMethod.CASH;

      const newPayment = await this.prisma.payment.create({
        data: {
          rideId: ride.id,
          riderId: ride.riderId,
          amount,
          currency: 'INR',
          method,
          provider: 'mock',
          status: PaymentStatus.PENDING,
        },
      });

      return newPayment;
    }

    return ride.payment;
  }

  /**
   * Initiate a payment flow (Rider only).
   */
  async initiatePayment(rideId: string, riderUserId: string, methodInput?: PaymentMethod) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { payment: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.riderId !== riderUserId) {
      throw new ForbiddenException('Access denied: You can only initiate payment for your own ride');
    }

    if (ride.status !== RideStatus.PAYMENT_PENDING && ride.status !== RideStatus.RIDE_COMPLETED) {
      throw new ConflictException(`Cannot initiate payment when ride status is ${ride.status}`);
    }

    const amount = ride.actualFare ?? ride.estimatedFare ?? 0;
    const selectedMethod = methodInput || (ride.paymentMethod as PaymentMethod) || PaymentMethod.CASH;

    // Existing payment check
    let payment = ride.payment;
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          rideId: ride.id,
          riderId: ride.riderId,
          amount,
          currency: 'INR',
          method: selectedMethod,
          provider: 'mock',
          status: PaymentStatus.PENDING,
        },
      });
    }

    // If payment already succeeded, return idempotently
    if (payment.status === PaymentStatus.SUCCEEDED) {
      return payment;
    }

    if (selectedMethod === PaymentMethod.CASH) {
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        },
      });

      this.realtimeService?.notifyRideStatusChanged(rideId, riderUserId, 'PAYMENT_PENDING', {
        paymentId: updated.id,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
      });

      return updated;
    }

    // Mock UPI Flow
    if (selectedMethod === PaymentMethod.UPI) {
      const result = await this.mockPaymentProvider.initiatePayment({
        rideId,
        riderId: riderUserId,
        amount,
        currency: 'INR',
        method: PaymentMethod.UPI,
      });

      if (result.status === PaymentStatus.FAILED) {
        const failedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            method: PaymentMethod.UPI,
            status: PaymentStatus.FAILED,
            failureReason: result.failureReason || 'Mock UPI payment failed',
          },
        });

        this.realtimeService?.notifyRideStatusChanged(rideId, riderUserId, 'PAYMENT_FAILED', {
          paymentId: failedPayment.id,
          reason: failedPayment.failureReason,
        });

        return failedPayment;
      }

      // Transition to PROCESSING
      this.paymentStateMachine.assertValidTransition(
        payment.status as PaymentStatus,
        PaymentStatus.PROCESSING,
      );

      const processingPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          method: PaymentMethod.UPI,
          status: PaymentStatus.PROCESSING,
          provider: result.provider || 'mock',
          providerPaymentId: result.providerPaymentId,
          transactionId: result.transactionId,
        },
      });

      this.realtimeService?.notifyRideStatusChanged(rideId, riderUserId, 'PAYMENT_PROCESSING', {
        paymentId: processingPayment.id,
        status: PaymentStatus.PROCESSING,
      });

      return processingPayment;
    }

    throw new BadRequestException(`Unsupported payment method: ${selectedMethod}`);
  }

  /**
   * Driver confirms CASH collection.
   * Atomically marks payment SUCCEEDED, ride COMPLETED, and releases driver to ONLINE_AVAILABLE.
   */
  async confirmCashPayment(rideId: string, driverUserId: string) {
    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverUserId },
    });

    if (!driverProfile) {
      // Check mock mapping for driver
      const mockDriverPhoneMap: Record<string, string> = {
        'mock-driver-id-001': '+918000000001',
        'mock-driver-id-002': '+918000000002',
        'mock-driver-id-003': '+918000000003',
      };
      const phone = mockDriverPhoneMap[driverUserId];
      let mappedProfile = null;
      if (phone) {
        const u = await this.prisma.user.findUnique({
          where: { phoneNumber: phone },
          include: { driverProfile: true },
        });
        mappedProfile = u?.driverProfile ?? null;
      }

      if (!mappedProfile) {
        throw new ForbiddenException('Access denied: Driver profile not found');
      }
      return this.executeCashSettlement(rideId, mappedProfile.id);
    }

    return this.executeCashSettlement(rideId, driverProfile.id);
  }

  private async executeCashSettlement(rideId: string, driverProfileId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { payment: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.driverProfileId !== driverProfileId) {
      throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
    }

    if (ride.status !== RideStatus.PAYMENT_PENDING && ride.status !== RideStatus.RIDE_COMPLETED) {
      if (ride.status === RideStatus.COMPLETED && ride.payment?.status === PaymentStatus.SUCCEEDED) {
        // Idempotent return if already completed
        return ride.payment;
      }
      throw new ConflictException(`Cannot confirm cash payment when ride status is ${ride.status}`);
    }

    const amount = ride.actualFare ?? ride.estimatedFare ?? 0;
    const now = new Date();

    // Transaction for atomic settlement
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert / update payment record to SUCCEEDED
      const payment = await tx.payment.upsert({
        where: { rideId: ride.id },
        create: {
          rideId: ride.id,
          riderId: ride.riderId,
          amount,
          currency: 'INR',
          method: PaymentMethod.CASH,
          provider: 'mock',
          status: PaymentStatus.SUCCEEDED,
          paidAt: now,
        },
        update: {
          method: PaymentMethod.CASH,
          status: PaymentStatus.SUCCEEDED,
          paidAt: now,
        },
      });

      // 2. Mark ride COMPLETED
      await tx.ride.update({
        where: { id: ride.id },
        data: {
          status: RideStatus.COMPLETED,
          completedAt: ride.completedAt ?? now,
        },
      });

      // 3. Release driver back to ONLINE_AVAILABLE
      if (ride.driverProfileId) {
        await tx.driverProfile.update({
          where: { id: ride.driverProfileId },
          data: { status: DriverStatus.ONLINE_AVAILABLE },
        });
      }

      return payment;
    });

    // Realtime events
    this.realtimeService?.notifyRideStatusChanged(rideId, ride.riderId, RideStatus.COMPLETED, {
      paymentId: result.id,
      paymentStatus: PaymentStatus.SUCCEEDED,
      rideStatus: RideStatus.COMPLETED,
    });

    this.logger.log(`💵 [PaymentsService] CASH payment confirmed for ride ${rideId}. Ride COMPLETED, driver ${ride.driverProfileId} unlocked.`);
    return result;
  }

  /**
   * Confirm/Complete Mock UPI payment.
   * Atomically marks payment SUCCEEDED, ride COMPLETED, and releases driver to ONLINE_AVAILABLE.
   */
  async confirmUpiPayment(
    rideId: string,
    riderUserId: string,
    options?: { simulateFailure?: boolean },
  ) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { payment: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.riderId !== riderUserId) {
      throw new ForbiddenException('Access denied: You can only confirm payment for your own ride');
    }

    let payment = ride.payment;

    if (!payment) {
      const amount = ride.actualFare ?? ride.estimatedFare ?? 0;
      payment = await this.prisma.payment.create({
        data: {
          rideId: ride.id,
          riderId: ride.riderId,
          amount,
          currency: 'INR',
          method: PaymentMethod.UPI,
          provider: 'mock',
          status: PaymentStatus.PENDING,
        },
      });
    }

    // Idempotent return if already succeeded
    if (payment.status === PaymentStatus.SUCCEEDED && ride.status === RideStatus.COMPLETED) {
      return payment;
    }

    // Simulate failure requested
    if (options?.simulateFailure) {
      const failedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: 'Simulated UPI transaction failure',
        },
      });

      this.realtimeService?.notifyRideStatusChanged(rideId, riderUserId, 'PAYMENT_FAILED', {
        paymentId: failedPayment.id,
        reason: failedPayment.failureReason,
      });

      return failedPayment;
    }

    // Successful settlement
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment status to SUCCEEDED
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          paidAt: now,
          providerPaymentId: payment.providerPaymentId || `mock_upi_${ride.id.replace(/-/g, '').slice(0, 12)}`,
        },
      });

      // 2. Mark Ride COMPLETED
      await tx.ride.update({
        where: { id: ride.id },
        data: {
          status: RideStatus.COMPLETED,
          completedAt: ride.completedAt ?? now,
        },
      });

      // 3. Release driver to ONLINE_AVAILABLE
      if (ride.driverProfileId) {
        await tx.driverProfile.update({
          where: { id: ride.driverProfileId },
          data: { status: DriverStatus.ONLINE_AVAILABLE },
        });
      }

      return updatedPayment;
    });

    // Realtime events
    this.realtimeService?.notifyRideStatusChanged(rideId, riderUserId, RideStatus.COMPLETED, {
      paymentId: result.id,
      paymentStatus: PaymentStatus.SUCCEEDED,
      rideStatus: RideStatus.COMPLETED,
    });

    this.logger.log(`📱 [PaymentsService] Mock UPI payment SUCCEEDED for ride ${rideId}. Ride COMPLETED, driver ${ride.driverProfileId} unlocked.`);
    return result;
  }
}

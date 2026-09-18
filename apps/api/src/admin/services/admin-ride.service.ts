import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RideStateMachineService } from '../../rides/services/ride-state-machine.service';
import { DriverStatus, NotificationType, RideStatus } from '@yatra-seva/shared-types';

@Injectable()
export class AdminRideService {
  private readonly logger = new Logger(AdminRideService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly stateMachine: RideStateMachineService,
    private readonly realtimeService: RealtimeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * List rides with server-side pagination and filtering.
   */
  async listRides(query: {
    page?: number;
    limit?: number;
    status?: string;
    vehicleType?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.vehicleType) {
      where.vehicleTypeId = query.vehicleType;
    }

    if (query.search) {
      const searchTerm = query.search.trim();
      where.OR = [
        { id: { contains: searchTerm } },
      ];
    }

    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        include: {
          location: true,
          rider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },
          driverProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                },
              },
            },
          },
          vehicle: {
            include: { vehicleType: true },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              paidAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ride.count({ where }),
    ]);

    return {
      data: rides,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed ride information.
   */
  async getRideDetail(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        location: true,
        rider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        driverProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
            vehicles: {
              where: { isActive: true, deletedAt: null },
              include: { vehicleType: true },
            },
          },
        },
        vehicle: {
          include: { vehicleType: true },
        },
        payment: true,
        ratings: {
          include: {
            raterUser: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
            ratedUser: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        driverRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found: ${rideId}`);
    }

    return ride;
  }

  /**
   * Admin cancels a ride. Only permitted from pre-RIDE_STARTED states.
   * Uses the centralized state machine for transition validation.
   */
  async cancelRide(rideId: string, adminUserId: string, reason: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driverProfile: true,
        payment: true,
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found: ${rideId}`);
    }

    // Validate via centralized state machine
    this.stateMachine.assertValidTransition(ride.status, RideStatus.CANCELLED_BY_ADMIN);

    // Additional safety: prevent admin cancel if payment is in progress
    if (ride.payment && ['PROCESSING', 'SUCCEEDED'].includes(ride.payment.status)) {
      throw new ConflictException(
        'Cannot cancel ride with active/completed payment. Payment state must be resolved first.',
      );
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      // Cancel the ride
      const result = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.CANCELLED_BY_ADMIN,
          cancelledAt: now,
          cancellationReason: `Admin cancellation: ${reason}`,
        },
      });

      // Free the assigned driver back to ONLINE_AVAILABLE (if applicable and not suspended)
      if (ride.driverProfileId) {
        const driverProfile = await tx.driverProfile.findUnique({
          where: { id: ride.driverProfileId },
        });

        if (driverProfile && driverProfile.verificationStatus === 'APPROVED') {
          await tx.driverProfile.update({
            where: { id: ride.driverProfileId },
            data: { status: DriverStatus.ONLINE_AVAILABLE },
          });
        } else if (driverProfile) {
          // Suspended/rejected driver goes offline
          await tx.driverProfile.update({
            where: { id: ride.driverProfileId },
            data: { status: DriverStatus.OFFLINE },
          });
        }
      }

      // Expire pending driver requests
      await tx.driverRideRequest.updateMany({
        where: { rideId, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      // Create audit log
      await this.auditService.createAuditLog(
        {
          adminUserId,
          action: 'RIDE_CANCELLED',
          entityType: 'RIDE',
          entityId: rideId,
          reason,
          metadata: {
            previousStatus: ride.status,
            riderId: ride.riderId,
            driverProfileId: ride.driverProfileId,
          },
        },
        tx,
      );

      return result;
    });

    // Emit realtime notifications
    this.realtimeService.notifyRideStatusChanged(
      rideId,
      ride.riderId,
      RideStatus.CANCELLED_BY_ADMIN,
      { reason: `Admin cancellation: ${reason}` },
    );

    // Notify rider
    this.notificationsService
      .createAndSendNotification({
        userId: ride.riderId,
        type: NotificationType.RIDE_CANCELLED_BY_ADMIN,
        title: 'Ride Cancelled',
        body: 'Your ride has been cancelled by the operations team.',
        data: { rideId, reason },
      })
      .catch((err) => this.logger.error(`Notification failed: ${err.message}`));

    this.logger.log(`Ride ${rideId} CANCELLED_BY_ADMIN by ${adminUserId}: ${reason}`);
    return updated;
  }
}

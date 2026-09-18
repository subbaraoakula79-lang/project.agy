import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { RideStatus, UserRole } from '@yatra-seva/shared-types';
import { TriggerSosDto, ResolveSosDto, ShareTripDto } from '../dto/safety.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private get db(): any {
    return this.prisma as any;
  }

  /**
   * Trigger SOS for an active ride.
   */
  async triggerSos(userId: string, dto: TriggerSosDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: dto.rideId },
      include: {
        driverProfile: true,
        location: true,
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${dto.rideId} not found`);
    }

    // Verify participation (must be rider or assigned driver)
    const isRider = ride.riderId === userId;
    const isDriver = ride.driverProfile?.userId === userId;

    if (!isRider && !isDriver) {
      throw new ForbiddenException('You are not authorized to trigger SOS for this ride');
    }

    // Eligible active ride states only
    const allowedStates = [
      RideStatus.DRIVER_ASSIGNED,
      RideStatus.DRIVER_ARRIVING,
      RideStatus.DRIVER_ARRIVED,
      RideStatus.RIDE_STARTED,
      RideStatus.RIDE_IN_PROGRESS,
    ];

    if (!allowedStates.includes(ride.status as RideStatus)) {
      throw new BadRequestException(
        `SOS cannot be triggered for ride in status ${ride.status}. Must be active in-progress trip.`,
      );
    }

    // Server-side Idempotency: Check if active unresolved SOS already exists for this ride & user
    const existingActiveSos = await this.db.safetyEvent.findFirst({
      where: {
        rideId: dto.rideId,
        reportedByUserId: userId,
        type: 'SOS_TRIGGERED',
        status: 'ACTIVE',
      },
    });

    if (existingActiveSos) {
      this.logger.warn(`Duplicate SOS trigger attempt for ride ${dto.rideId} by user ${userId}`);
      return existingActiveSos; // Idempotent return of active event
    }

    // Persist safety event
    const safetyEvent = await this.db.safetyEvent.create({
      data: {
        rideId: dto.rideId,
        reportedByUserId: userId,
        type: 'SOS_TRIGGERED',
        status: 'ACTIVE',
        description: dto.description || 'Emergency SOS triggered from mobile application',
      },
    });

    // Non-fatal notification to admin workflow
    try {
      await this.notificationsService.createAndSendNotification({
        userId,
        type: 'RIDE_UPDATED' as any,
        title: '🚨 Emergency SOS Triggered',
        body: `Emergency alert for ride #${dto.rideId.substring(0, 8)}. Immediate support assigned.`,
        data: { safetyEventId: safetyEvent.id, rideId: dto.rideId },
      });
    } catch (err: any) {
      this.logger.error(`Non-fatal notification error on SOS trigger: ${err.message}`);
    }

    return safetyEvent;
  }

  /**
   * Admin resolution of an SOS event.
   */
  async resolveSos(eventId: string, adminUserId: string, dto: ResolveSosDto) {
    const safetyEvent = await this.db.safetyEvent.findUnique({
      where: { id: eventId },
    });

    if (!safetyEvent) {
      throw new NotFoundException(`Safety event ${eventId} not found`);
    }

    if (safetyEvent.status === 'RESOLVED') {
      throw new BadRequestException('Safety event is already resolved');
    }

    const updatedEvent = await this.db.safetyEvent.update({
      where: { id: eventId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByUserId: adminUserId,
      },
    });

    // Write to append-only AdminAuditLog
    await this.db.adminAuditLog.create({
      data: {
        adminUserId,
        action: 'SOS_RESOLVED',
        entityType: 'SAFETY_EVENT',
        entityId: eventId,
        reason: dto.reason || 'Admin safety intervention resolution',
        metadata: { rideId: safetyEvent.rideId },
      },
    });

    return updatedEvent;
  }

  /**
   * Generate a safe trip share reference link token.
   */
  async createTripShare(userId: string, dto: ShareTripDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: dto.rideId },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${dto.rideId} not found`);
    }

    if (ride.riderId !== userId) {
      throw new ForbiddenException('Only the rider can share trip details');
    }

    const shareToken = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h validity

    const tripShare = await this.db.tripShare.create({
      data: {
        rideId: dto.rideId,
        shareToken,
        createdByUserId: userId,
        expiresAt,
      },
    });

    return {
      shareToken: tripShare.shareToken,
      shareUrl: `/shared-trip/${tripShare.shareToken}`,
      expiresAt: tripShare.expiresAt,
    };
  }

  /**
   * Public retrieval of shared trip representation (sanitised, zero private user data).
   */
  async getSharedTrip(token: string) {
    const tripShare = await this.db.tripShare.findUnique({
      where: { shareToken: token },
      include: {
        ride: {
          include: {
            location: true,
            rider: true,
            driverProfile: {
              include: { user: true },
            },
            vehicle: {
              include: { vehicleType: true },
            },
          },
        },
      },
    });

    if (!tripShare) {
      throw new NotFoundException('Shared trip link invalid or expired');
    }

    if (new Date() > tripShare.expiresAt) {
      throw new BadRequestException('Shared trip link has expired');
    }

    const ride = tripShare.ride;

    // Return strictly sanitised, public-safe fields (NO phone numbers, NO tokens, NO private IDs)
    return {
      shareToken: tripShare.shareToken,
      rideId: ride.id,
      status: ride.status,
      pickupAddress: ride.location?.pickupAddress || 'Pickup address unavailable',
      dropAddress: ride.location?.dropAddress || 'Drop address unavailable',
      vehicleType: ride.vehicle?.vehicleType?.displayName || 'Vehicle',
      vehicleRegistration: ride.vehicle?.registrationNumber || null,
      driverFirstName: ride.driverProfile?.user?.firstName || 'Captain',
      riderFirstName: ride.rider?.firstName || 'Rider',
      expiresAt: tripShare.expiresAt.toISOString(),
    };
  }

  /**
   * List safety events for Admin.
   */
  async listSafetyEvents(query: { page?: number; limit?: number; status?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [events, total] = await Promise.all([
      this.db.safetyEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ride: true,
          reportedByUser: { select: { id: true, firstName: true, lastName: true, role: true } },
          resolvedByUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.db.safetyEvent.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

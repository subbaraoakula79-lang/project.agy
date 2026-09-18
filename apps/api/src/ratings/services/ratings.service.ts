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
import { CreateRatingDto } from '../dto/create-rating.dto';
import { NotificationType, RideStatus } from '@yatra-seva/shared-types';

const COMPLETED_RIDE_STATUSES: string[] = [
  RideStatus.COMPLETED,
  RideStatus.RIDE_COMPLETED,
  RideStatus.PAYMENT_PENDING,
  RideStatus.PAYMENT_FAILED,
];

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Submit a rating for a completed ride.
   * Validates participation, completed state, integer range, self-rating prevention, and duplicate submission.
   */
  async createRating(rideId: string, raterUserId: string, dto: CreateRatingDto) {
    const { rating, comment } = dto;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be an integer between 1 and 5');
    }

    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driverProfile: true,
        rider: true,
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found: ${rideId}`);
    }

    // Must be completed (or in post-completion payment resolution state)
    if (!COMPLETED_RIDE_STATUSES.includes(ride.status) && !ride.completedAt) {
      throw new BadRequestException('Only completed rides can be rated');
    }

    // Determine participation and ratee
    const isRider = ride.riderId === raterUserId;
    const isDriver = ride.driverProfile?.userId === raterUserId;

    if (!isRider && !isDriver) {
      throw new ForbiddenException('Only participants of this ride can submit a rating');
    }

    let ratedUserId: string;
    if (isRider) {
      if (!ride.driverProfile?.userId) {
        throw new BadRequestException('Cannot rate ride with no assigned driver');
      }
      ratedUserId = ride.driverProfile.userId;
    } else {
      ratedUserId = ride.riderId;
    }

    // Prevent self-rating
    if (raterUserId === ratedUserId) {
      throw new BadRequestException('Users cannot rate themselves');
    }

    // Check for existing rating by same rater for this ride
    const existing = await this.prisma.rating.findUnique({
      where: {
        rideId_raterUserId: {
          rideId,
          raterUserId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a rating for this ride');
    }

    // Create rating record in persistent database transaction
    const newRating = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rating.create({
        data: {
          rideId,
          raterUserId,
          ratedUserId,
          rating,
          comment: comment ? comment.trim() : null,
        },
        include: {
          raterUser: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          ratedUser: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });

      // Recalculate and update aggregate average rating for rated user
      const userRatings = await tx.rating.findMany({
        where: { ratedUserId },
        select: { rating: true },
      });

      const totalCount = userRatings.length;
      const sum = userRatings.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = totalCount > 0 ? Number((sum / totalCount).toFixed(2)) : 0;

      // Update DriverProfile aggregate if ratee is a driver
      const driverProfile = await tx.driverProfile.findUnique({
        where: { userId: ratedUserId },
      });

      if (driverProfile) {
        await tx.driverProfile.update({
          where: { userId: ratedUserId },
          data: {
            averageRating: avgRating,
          },
        });
      }

      // Update RiderProfile aggregate if ratee is a rider
      const riderProfile = await tx.riderProfile.findUnique({
        where: { userId: ratedUserId },
      });

      if (riderProfile) {
        await tx.riderProfile.update({
          where: { userId: ratedUserId },
          data: {
            averageRating: avgRating,
          },
        });
      }

      return created;
    });

    // Send non-blocking rating notification
    this.notificationsService
      .createAndSendNotification({
        userId: ratedUserId,
        type: NotificationType.RIDE_COMPLETED,
        title: 'New Rating Received',
        body: `You received a ${rating}-star rating for your recent ride.`,
        data: { rideId, ratingId: newRating.id, rating },
      })
      .catch((err) => this.logger.error(`Rating notification dispatch failed: ${err.message}`));

    this.logger.log(
      `Rating created: ride ${rideId}, rater ${raterUserId} -> ratee ${ratedUserId} (${rating} stars)`,
    );

    return newRating;
  }

  /**
   * Fetch ratings for a specific ride (accessible by ride participants or admin).
   */
  async getRideRatings(rideId: string, requestingUserId: string, isAdmin = false) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driverProfile: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found: ${rideId}`);
    }

    if (!isAdmin) {
      const isRider = ride.riderId === requestingUserId;
      const isDriver = ride.driverProfile?.userId === requestingUserId;
      if (!isRider && !isDriver) {
        throw new ForbiddenException('Access denied to ride ratings');
      }
    }

    return this.prisma.rating.findMany({
      where: { rideId },
      include: {
        raterUser: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        ratedUser: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch ratings given or received by the current authenticated user.
   */
  async getUserRatings(userId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      OR: [{ raterUserId: userId }, { ratedUserId: userId }],
    };

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        include: {
          raterUser: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          ratedUser: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          ride: {
            select: { id: true, status: true, requestedAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rating.count({ where }),
    ]);

    return {
      data: ratings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

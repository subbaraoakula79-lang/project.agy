import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Address, DriverStatus, FareEstimate, RideStatus, UserRole, VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { DriverMatchingService } from '../../drivers/services/driver-matching.service';
import { FareService } from '../../fare/fare.service';
import { MockMapService, MockRoutingService } from '../../providers/mock/mock-map.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { CreateRideDto } from '../dto/create-ride.dto';
import { FareEstimateQueryDto } from '../dto/fare-estimate-query.dto';
import { RideStateMachineService } from './ride-state-machine.service';

export interface RideRecord {
  id: string;
  riderId: string;
  driverProfileId: string | null;
  driver?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    vehicle?: {
      make?: string | null;
      model?: string | null;
      color?: string | null;
      registrationNumber: string;
      year?: number | null;
    } | null;
  } | null;
  vehicleTypeId: string;
  vehicleType: VehicleType;
  cityId: string;
  status: RideStatus;
  paymentMethod: string;
  estimatedFare: number;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  dropLatitude: number;
  dropLongitude: number;
  dropAddress: string;
  requestedAt: string;
  acceptedAt?: string | null;
  arrivingAt?: string | null;
  driverArrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);
  private readonly stateMachine: RideStateMachineService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fareService: FareService,
    private readonly mockMapService: MockMapService,
    private readonly mockRoutingService: MockRoutingService,
    @Optional() private readonly matchingService?: DriverMatchingService,
    @Optional() private readonly realtimeService?: RealtimeService,
    @Optional() stateMachine?: RideStateMachineService,
  ) {
    this.stateMachine = stateMachine ?? new RideStateMachineService();
  }

  /** Get Kakinada places list for destination autocomplete. */
  async getKakinadaLocations(): Promise<Address[]> {
    return this.mockMapService.searchPlaces('');
  }

  /** Calculate fare estimates for all vehicle types (BIKE, AUTO, CAB). */
  async getFareEstimates(dto: FareEstimateQueryDto): Promise<FareEstimate[]> {
    const origin = { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude };
    const destination = { latitude: dto.dropLatitude, longitude: dto.dropLongitude };

    const route = await this.mockRoutingService.getRoute(origin, destination);

    return this.fareService.calculateAllFares({
      cityId: 'd75253d1-4456-42c6-8483-e726bd20d156', // Kakinada city ID
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    });
  }

  /**
   * Create a new ride request via Prisma/PostgreSQL.
   * In Phase 4, progresses from REQUESTED -> SEARCHING_DRIVER -> Driver matching.
   */
  async createRide(
    riderId: string,
    userRole: UserRole,
    dto: CreateRideDto,
    options?: { autoMatch?: boolean; autoAssign?: boolean },
  ): Promise<RideRecord> {
    if (userRole !== UserRole.RIDER) {
      throw new ForbiddenException('Only riders can request rides');
    }

    const origin = { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude };
    const destination = { latitude: dto.dropLatitude, longitude: dto.dropLongitude };

    const route = await this.mockRoutingService.getRoute(origin, destination);
    const fareEstimate = await this.fareService.calculateFare({
      cityId: 'd75253d1-4456-42c6-8483-e726bd20d156',
      vehicleType: dto.vehicleType,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    });

    // 1. Create ride directly in PostgreSQL via Prisma Client with initial status REQUESTED
    const created = await this.prisma.ride.create({
      data: {
        riderId,
        driverProfileId: null,
        vehicleTypeId: dto.vehicleType,
        cityId: 'd75253d1-4456-42c6-8483-e726bd20d156',
        status: RideStatus.REQUESTED,
        paymentMethod: dto.paymentMethod,
        estimatedFare: fareEstimate.totalFare,
        estimatedDistanceMeters: route.distanceMeters,
        estimatedDurationSeconds: route.durationSeconds,
        location: {
          create: {
            pickupLatitude: dto.pickupLatitude,
            pickupLongitude: dto.pickupLongitude,
            pickupAddress: dto.pickupAddress,
            dropLatitude: dto.dropLatitude,
            dropLongitude: dto.dropLongitude,
            dropAddress: dto.dropAddress,
          },
        },
      },
      include: {
        location: true,
      },
    });

    this.logger.log(`🚗 [RidesService] Ride created in PostgreSQL: ${created.id} (status: ${created.status})`);

    // 2. Phase 4 matching lifecycle
    if (this.matchingService && options?.autoMatch !== false) {
      return this.searchAndMatchDriver(created.id, { autoAssign: options?.autoAssign });
    }

    return this.mapPrismaRideToRecord(created);
  }

  /**
   * Transition ride to SEARCHING_DRIVER and attempt driver matching.
   */
  async searchAndMatchDriver(rideId: string, options?: { autoAssign?: boolean }): Promise<RideRecord> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found with ID: ${rideId}`);
    }

    if (ride.status !== RideStatus.REQUESTED && ride.status !== RideStatus.SEARCHING_DRIVER) {
      return this.mapPrismaRideToRecord(ride);
    }

    // Update state to SEARCHING_DRIVER
    const searching = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.SEARCHING_DRIVER },
      include: { location: true },
    });

    this.realtimeService?.notifyRideStatusChanged(rideId, ride.riderId, RideStatus.SEARCHING_DRIVER);

    if (!this.matchingService || !ride.location) {
      return this.mapPrismaRideToRecord(searching);
    }

    // Find eligible drivers via DriverMatchingService
    const eligible = await this.matchingService.findEligibleDrivers({
      pickupLocation: {
        latitude: ride.location.pickupLatitude,
        longitude: ride.location.pickupLongitude,
      },
      vehicleType: ride.vehicleTypeId as any,
      cityId: ride.cityId,
      rideId: ride.id,
    });

    if (eligible.length === 0) {
      const cancelled = await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.CANCELLED_NO_DRIVER,
          cancellationReason: 'No available drivers found nearby',
        },
        include: { location: true },
      });

      this.realtimeService?.notifyRideStatusChanged(rideId, ride.riderId, RideStatus.CANCELLED_NO_DRIVER, {
        reason: 'No available drivers found nearby',
      });

      this.logger.log(`🚗 [RidesService] Ride ${rideId} cancelled: CANCELLED_NO_DRIVER`);
      return this.mapPrismaRideToRecord(cancelled);
    }

    const matchedDriver = eligible[0]!;
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds expiry

    if (options?.autoAssign) {
      // Direct driver assignment mode (Goal E)
      const assigned = await this.prisma.$transaction(async (tx) => {
        await tx.driverRideRequest.create({
          data: {
            rideId: ride.id,
            driverProfileId: matchedDriver.driverId,
            status: 'ACCEPTED',
            expiresAt,
            respondedAt: new Date(),
          },
        });

        await tx.driverProfile.update({
          where: { id: matchedDriver.driverId },
          data: { status: DriverStatus.BUSY },
        });

        return tx.ride.update({
          where: { id: rideId },
          data: {
            driverProfileId: matchedDriver.driverId,
            status: RideStatus.DRIVER_ASSIGNED,
            acceptedAt: new Date(),
          },
          include: {
            location: true,
            driverProfile: {
              include: {
                user: true,
                vehicles: { where: { isActive: true, deletedAt: null } },
              },
            },
          },
        });
      });

      this.realtimeService?.notifyDriverAccepted(rideId, {
        rideId,
        driverProfileId: matchedDriver.driverId,
        status: RideStatus.DRIVER_ASSIGNED,
      });

      this.logger.log(`🚗 [RidesService] Ride ${rideId} directly assigned to driver ${matchedDriver.driverId}`);
      return this.mapPrismaRideToRecord(assigned);
    }

    // Standard offer mode (Goal F & G)
    const pendingRequest = await this.prisma.driverRideRequest.create({
      data: {
        rideId: ride.id,
        driverProfileId: matchedDriver.driverId,
        status: 'PENDING',
        expiresAt,
      },
    });

    this.realtimeService?.notifyDriverRideOffered(matchedDriver.driverId, {
      requestId: pendingRequest.id,
      rideId: ride.id,
      pickupAddress: ride.location.pickupAddress,
      dropAddress: ride.location.dropAddress,
      estimatedFare: ride.estimatedFare,
      vehicleType: ride.vehicleTypeId,
      expiresAt: expiresAt.toISOString(),
    });

    this.logger.log(
      `🚗 [RidesService] Offered ride ${rideId} to driver ${matchedDriver.driverId} (distance: ${matchedDriver.distanceMeters}m)`,
    );

    return this.mapPrismaRideToRecord(searching);
  }

  /**
   * Handle expiration / timeout of a driver ride request.
   */
  async handleRequestTimeout(requestId: string): Promise<void> {
    const request = await this.prisma.driverRideRequest.findUnique({
      where: { id: requestId },
      include: { ride: true },
    });

    if (!request || request.status !== 'PENDING') {
      return;
    }

    await this.prisma.driverRideRequest.update({
      where: { id: requestId },
      data: { status: 'EXPIRED' },
    });

    this.logger.log(`DriverRideRequest ${requestId} expired`);

    // Continue matching for the ride if still searching
    if (request.ride && request.ride.status === RideStatus.SEARCHING_DRIVER) {
      await this.searchAndMatchDriver(request.rideId);
    }
  }

  /** Get all rides requested by the authenticated rider directly from PostgreSQL. */
  async getRiderRides(riderId: string, userRole: UserRole): Promise<RideRecord[]> {
    if (userRole !== UserRole.RIDER) {
      throw new ForbiddenException('Only riders can list their rides');
    }

    const rides = await this.prisma.ride.findMany({
      where: { riderId },
      include: { location: true },
      orderBy: { createdAt: 'desc' },
    });

    return rides.map((r) => this.mapPrismaRideToRecord(r));
  }

  /** Get a specific ride by ID from PostgreSQL (enforces ownership). */
  async getRideById(rideId: string, requestingUserId: string, userRole: UserRole): Promise<RideRecord> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        location: true,
        driverProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, phoneNumber: true } },
            vehicles: { where: { isActive: true, deletedAt: null } },
          },
        },
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found with ID: ${rideId}`);
    }

    // Ownership check for Riders
    if (userRole === UserRole.RIDER && ride.riderId !== requestingUserId) {
      throw new ForbiddenException('Access denied: You can only access your own ride requests');
    }

    // Ownership check for Drivers
    if (userRole === UserRole.DRIVER) {
      const driverProfile = await this.prisma.driverProfile.findUnique({
        where: { userId: requestingUserId },
      });

      if (!driverProfile) {
        throw new ForbiddenException('Access denied: Driver profile not found');
      }

      const isAssignedDriver = ride.driverProfileId === driverProfile.id;
      const hasOffer = await this.prisma.driverRideRequest.findFirst({
        where: { rideId: ride.id, driverProfileId: driverProfile.id },
      });

      if (!isAssignedDriver && !hasOffer) {
        throw new ForbiddenException('Access denied: You are not authorized to view this ride');
      }
    }

    return this.mapPrismaRideToRecord(ride);
  }

  /**
   * Get the current active ride for the authenticated rider or driver.
   */
  async getActiveRide(requestingUserId: string, userRole: UserRole): Promise<RideRecord | null> {
    const activeStatuses = [
      'REQUESTED',
      'SEARCHING_DRIVER',
      'DRIVER_ASSIGNED',
      'DRIVER_ARRIVING',
      'DRIVER_EN_ROUTE',
      'DRIVER_ARRIVED',
      'RIDE_STARTED',
      'RIDE_IN_PROGRESS',
      'RIDE_COMPLETED',
      'PAYMENT_PENDING',
    ];

    if (userRole === UserRole.RIDER) {
      const ride = await this.prisma.ride.findFirst({
        where: {
          riderId: requestingUserId,
          status: { in: activeStatuses },
        },
        include: {
          location: true,
          driverProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, phoneNumber: true } },
              vehicles: { where: { isActive: true, deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return ride ? this.mapPrismaRideToRecord(ride) : null;
    }

    if (userRole === UserRole.DRIVER) {
      const driverProfile = await this.prisma.driverProfile.findUnique({
        where: { userId: requestingUserId },
      });
      if (!driverProfile) {
        return null;
      }
      const ride = await this.prisma.ride.findFirst({
        where: {
          driverProfileId: driverProfile.id,
          status: { in: activeStatuses },
        },
        include: {
          location: true,
          driverProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, phoneNumber: true } },
              vehicles: { where: { isActive: true, deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return ride ? this.mapPrismaRideToRecord(ride) : null;
    }

    if (userRole === UserRole.ADMIN) {
      const ride = await this.prisma.ride.findFirst({
        where: { status: { in: activeStatuses } },
        include: {
          location: true,
          driverProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, phoneNumber: true } },
              vehicles: { where: { isActive: true, deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return ride ? this.mapPrismaRideToRecord(ride) : null;
    }

    return null;
  }

  /**
   * Rider cancels an active ride if permissible by the state machine.
   */
  async cancelRiderRide(riderId: string, rideId: string, reason?: string): Promise<RideRecord> {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        location: true,
        driverProfile: true,
      },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found with ID: ${rideId}`);
    }

    if (ride.riderId !== riderId) {
      throw new ForbiddenException('Access denied: You can only cancel your own ride');
    }

    // Validate using centralized state machine
    this.stateMachine.assertRiderCanCancel(ride.status);

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      // If a driver was assigned, free the driver back to ONLINE_AVAILABLE
      if (ride.driverProfileId) {
        await tx.driverProfile.update({
          where: { id: ride.driverProfileId },
          data: { status: DriverStatus.ONLINE_AVAILABLE },
        });
      }

      // Expire or cancel any pending driver requests for this ride
      await tx.driverRideRequest.updateMany({
        where: { rideId: ride.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      return tx.ride.update({
        where: { id: rideId },
        data: {
          status: RideStatus.CANCELLED_BY_RIDER,
          cancelledAt: now,
          cancellationReason: reason || 'Cancelled by rider',
        },
        include: {
          location: true,
          driverProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, phoneNumber: true } },
              vehicles: { where: { isActive: true, deletedAt: null } },
            },
          },
        },
      });
    });

    this.realtimeService?.notifyRideStatusChanged(rideId, riderId, RideStatus.CANCELLED_BY_RIDER, {
      reason: reason || 'Cancelled by rider',
    });

    this.logger.log(`🚗 [RidesService] Ride ${rideId} cancelled by rider`);
    return this.mapPrismaRideToRecord(updated);
  }

  /** Helper to map Prisma Ride object to RideRecord contract. */
  private mapPrismaRideToRecord(ride: any): RideRecord {
    const driver = ride.driverProfile
      ? {
          id: ride.driverProfile.id,
          firstName: ride.driverProfile.user?.firstName ?? null,
          lastName: ride.driverProfile.user?.lastName ?? null,
          phoneNumber: ride.driverProfile.user?.phoneNumber ?? null,
          vehicle: ride.driverProfile.vehicles?.[0]
            ? {
                make: ride.driverProfile.vehicles[0].make,
                model: ride.driverProfile.vehicles[0].model,
                color: ride.driverProfile.vehicles[0].color,
                registrationNumber: ride.driverProfile.vehicles[0].registrationNumber,
                year: ride.driverProfile.vehicles[0].year,
              }
            : null,
        }
      : null;

    return {
      id: ride.id,
      riderId: ride.riderId,
      driverProfileId: ride.driverProfileId,
      driver,
      vehicleTypeId: ride.vehicleTypeId,
      vehicleType: ride.vehicleTypeId as VehicleType,
      cityId: ride.cityId,
      status: ride.status as RideStatus,
      paymentMethod: ride.paymentMethod,
      estimatedFare: ride.estimatedFare ?? 0,
      estimatedDistanceMeters: ride.estimatedDistanceMeters ?? 0,
      estimatedDurationSeconds: ride.estimatedDurationSeconds ?? 0,
      pickupLatitude: ride.location?.pickupLatitude ?? 0,
      pickupLongitude: ride.location?.pickupLongitude ?? 0,
      pickupAddress: ride.location?.pickupAddress ?? '',
      dropLatitude: ride.location?.dropLatitude ?? 0,
      dropLongitude: ride.location?.dropLongitude ?? 0,
      dropAddress: ride.location?.dropAddress ?? '',
      requestedAt: ride.requestedAt ? new Date(ride.requestedAt).toISOString() : new Date().toISOString(),
      acceptedAt: ride.acceptedAt ? new Date(ride.acceptedAt).toISOString() : null,
      arrivingAt: ride.arrivingAt ? new Date(ride.arrivingAt).toISOString() : null,
      driverArrivedAt: ride.driverArrivedAt ? new Date(ride.driverArrivedAt).toISOString() : null,
      startedAt: ride.startedAt ? new Date(ride.startedAt).toISOString() : null,
      completedAt: ride.completedAt ? new Date(ride.completedAt).toISOString() : null,
      cancelledAt: ride.cancelledAt ? new Date(ride.cancelledAt).toISOString() : null,
      createdAt: ride.createdAt ? new Date(ride.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: ride.updatedAt ? new Date(ride.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}

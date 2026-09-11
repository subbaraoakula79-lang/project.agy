import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DriverAvailabilityDto, DriverStatus, UserRole } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { RideStateMachineService } from '../../rides/services/ride-state-machine.service';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { DriverMatchingService } from './driver-matching.service';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);
  private readonly stateMachine: RideStateMachineService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly matchingService: DriverMatchingService,
    @Optional() stateMachine?: RideStateMachineService,
  ) {
    this.stateMachine = stateMachine ?? new RideStateMachineService();
  }

  /**
   * Helper to retrieve a DriverProfile for a given userId.
   */
  async getDriverProfileByUserId(userId: string) {
    let profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        vehicles: {
          where: { isActive: true, deletedAt: null },
          include: { vehicleType: true },
        },
      },
    });

    if (!profile) {
      // Support mock auth user ID mapping from Phase 2 mock user service
      const mockDriverPhoneMap: Record<string, string> = {
        'mock-driver-id-001': '+918000000001',
        'mock-driver-id-002': '+918000000002',
        'mock-driver-id-003': '+918000000003',
      };
      const phone = mockDriverPhoneMap[userId];
      if (phone) {
        const user = await this.prisma.user.findUnique({
          where: { phoneNumber: phone },
          include: {
            driverProfile: {
              include: {
                vehicles: {
                  where: { isActive: true, deletedAt: null },
                  include: { vehicleType: true },
                },
              },
            },
          },
        });
        profile = user?.driverProfile ?? null;
      }
    }

    if (!profile) {
      throw new NotFoundException(`Driver profile not found for user ${userId}`);
    }

    return profile;
  }

  /**
   * Set driver status to ONLINE_AVAILABLE if driver has an active vehicle.
   */
  async setOnline(userId: string): Promise<DriverAvailabilityDto> {
    const profile = await this.getDriverProfileByUserId(userId);

    const hasActiveVehicle = profile.vehicles.length > 0;
    if (!hasActiveVehicle) {
      throw new BadRequestException('Cannot go online without an active, registered vehicle');
    }

    const updated = await this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: { status: DriverStatus.ONLINE_AVAILABLE },
      include: {
        vehicles: {
          where: { isActive: true, deletedAt: null },
          include: { vehicleType: true },
        },
      },
    });

    this.logger.log(`Driver ${profile.id} is now ONLINE_AVAILABLE`);

    const activeVehicle = updated.vehicles[0];
    return {
      status: 'ONLINE_AVAILABLE',
      hasActiveVehicle: true,
      activeVehicle: activeVehicle
        ? {
            id: activeVehicle.id,
            make: activeVehicle.make,
            model: activeVehicle.model,
            registrationNumber: activeVehicle.registrationNumber,
            vehicleTypeName: activeVehicle.vehicleType.name,
          }
        : null,
      currentLatitude: updated.currentLatitude,
      currentLongitude: updated.currentLongitude,
      lastLocationAt: updated.lastLocationAt?.toISOString() ?? null,
    };
  }

  /**
   * Set driver status to OFFLINE if not on an active ride.
   */
  async setOffline(userId: string): Promise<DriverAvailabilityDto> {
    const profile = await this.getDriverProfileByUserId(userId);

    // Check if driver has an active assigned ride
    const activeRide = await this.prisma.ride.findFirst({
      where: {
        driverProfileId: profile.id,
        status: {
          in: [
            'DRIVER_ASSIGNED',
            'DRIVER_EN_ROUTE',
            'DRIVER_ARRIVING',
            'DRIVER_ARRIVED',
            'RIDE_IN_PROGRESS',
            'RIDE_STARTED',
            'RIDE_COMPLETED',
            'PAYMENT_PENDING',
          ],
        },
      },
    });

    if (activeRide) {
      throw new BadRequestException('Cannot go offline while assigned to an active ride or pending payment');
    }

    const updated = await this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: { status: DriverStatus.OFFLINE },
      include: {
        vehicles: {
          where: { isActive: true, deletedAt: null },
          include: { vehicleType: true },
        },
      },
    });

    this.logger.log(`Driver ${profile.id} is now OFFLINE`);

    const activeVehicle = updated.vehicles[0];
    return {
      status: 'OFFLINE',
      hasActiveVehicle: updated.vehicles.length > 0,
      activeVehicle: activeVehicle
        ? {
            id: activeVehicle.id,
            make: activeVehicle.make,
            model: activeVehicle.model,
            registrationNumber: activeVehicle.registrationNumber,
            vehicleTypeName: activeVehicle.vehicleType.name,
          }
        : null,
      currentLatitude: updated.currentLatitude,
      currentLongitude: updated.currentLongitude,
      lastLocationAt: updated.lastLocationAt?.toISOString() ?? null,
    };
  }

  /**
   * Get current driver availability details.
   */
  async getAvailability(userId: string): Promise<DriverAvailabilityDto> {
    const profile = await this.getDriverProfileByUserId(userId);
    const activeVehicle = profile.vehicles[0];

    return {
      status: (profile.status as 'OFFLINE' | 'ONLINE_AVAILABLE' | 'BUSY') || 'OFFLINE',
      hasActiveVehicle: profile.vehicles.length > 0,
      activeVehicle: activeVehicle
        ? {
            id: activeVehicle.id,
            make: activeVehicle.make,
            model: activeVehicle.model,
            registrationNumber: activeVehicle.registrationNumber,
            vehicleTypeName: activeVehicle.vehicleType.name,
          }
        : null,
      currentLatitude: profile.currentLatitude,
      currentLongitude: profile.currentLongitude,
      lastLocationAt: profile.lastLocationAt?.toISOString() ?? null,
    };
  }

  /**
   * Update driver's persisted location and notify active ride if applicable.
   */
  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const profile = await this.getDriverProfileByUserId(userId);
    const now = new Date();
    const recordedAt = dto.timestamp ? new Date(dto.timestamp) : now;

    // Deduplication check: ignore tiny movement (< 2 meters) recorded within 5 seconds
    if (
      profile.currentLatitude != null &&
      profile.currentLongitude != null &&
      profile.lastLocationAt != null
    ) {
      const dist = this.haversineMeters(
        profile.currentLatitude,
        profile.currentLongitude,
        dto.latitude,
        dto.longitude,
      );
      const timeDiffSec = (now.getTime() - profile.lastLocationAt.getTime()) / 1000;
      if (dist < 2.0 && timeDiffSec < 5.0) {
        // Skip duplicate write
        return {
          latitude: profile.currentLatitude,
          longitude: profile.currentLongitude,
          accuracy: dto.accuracy ?? null,
          heading: dto.heading ?? null,
          speed: dto.speed ?? null,
          lastLocationAt: profile.lastLocationAt,
          freshness: this.calculateFreshness(profile.lastLocationAt),
        };
      }
    }

    // Persist location history and update current coordinates in a transaction
    const [driverLoc, updatedProfile] = await this.prisma.$transaction([
      this.prisma.driverLocation.create({
        data: {
          driverProfileId: profile.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy ?? null,
          heading: dto.heading ?? null,
          speed: dto.speed ?? null,
          recordedAt: recordedAt,
        },
      }),
      this.prisma.driverProfile.update({
        where: { id: profile.id },
        data: {
          currentLatitude: dto.latitude,
          currentLongitude: dto.longitude,
          lastLocationAt: now,
        },
      }),
    ]);

    // Check if on an active ride, and emit location update to ride room
    const activeRide = await this.prisma.ride.findFirst({
      where: {
        driverProfileId: profile.id,
        status: {
          in: [
            'DRIVER_ASSIGNED',
            'DRIVER_EN_ROUTE',
            'DRIVER_ARRIVING',
            'DRIVER_ARRIVED',
            'RIDE_IN_PROGRESS',
            'RIDE_STARTED',
            'PAYMENT_PENDING',
          ],
        },
      },
      select: { id: true, riderId: true },
    });

    if (activeRide) {
      this.realtimeService?.notifyDriverLocationUpdated(activeRide.id, {
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        heading: dto.heading,
        speed: dto.speed,
        recordedAt: recordedAt.toISOString(),
      });
    }

    return {
      latitude: updatedProfile.currentLatitude,
      longitude: updatedProfile.currentLongitude,
      accuracy: driverLoc.accuracy,
      heading: driverLoc.heading,
      speed: driverLoc.speed,
      lastLocationAt: updatedProfile.lastLocationAt,
      freshness: 'FRESH',
    };
  }

  /**
   * Get latest driver location for an active ride with strict RBAC & ownership check.
   */
  async getDriverLocationForRide(
    rideId: string,
    requestingUserId: string,
    userRole: UserRole,
  ) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driverProfile: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    // Ownership check for Rider
    if (userRole === UserRole.RIDER && ride.riderId !== requestingUserId) {
      throw new ForbiddenException('Access denied: You can only view driver location for your own ride');
    }

    // Ownership check for Driver
    if (userRole === UserRole.DRIVER) {
      const driverProfile = await this.getDriverProfileByUserId(requestingUserId);
      if (ride.driverProfileId !== driverProfile.id) {
        throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
      }
    }

    if (!ride.driverProfileId || !ride.driverProfile) {
      return {
        driverProfileId: null,
        latitude: null,
        longitude: null,
        accuracy: null,
        heading: null,
        speed: null,
        freshness: 'UNAVAILABLE' as const,
        recordedAt: null,
        receivedAt: new Date().toISOString(),
      };
    }

    const latestLocation = await this.prisma.driverLocation.findFirst({
      where: { driverProfileId: ride.driverProfileId },
      orderBy: { recordedAt: 'desc' },
    });

    const lat = latestLocation?.latitude ?? ride.driverProfile.currentLatitude;
    const lng = latestLocation?.longitude ?? ride.driverProfile.currentLongitude;
    const lastTime = latestLocation?.recordedAt ?? ride.driverProfile.lastLocationAt;
    const staleThreshold = parseInt(process.env.LOCATION_STALE_AFTER_SECONDS || '30', 10);
    const freshness = this.calculateFreshness(lastTime, staleThreshold);

    return {
      driverProfileId: ride.driverProfileId,
      latitude: lat,
      longitude: lng,
      accuracy: latestLocation?.accuracy ?? null,
      heading: latestLocation?.heading ?? null,
      speed: latestLocation?.speed ?? null,
      freshness,
      recordedAt: lastTime?.toISOString() ?? null,
      receivedAt: new Date().toISOString(),
    };
  }

  calculateFreshness(lastLocationAt: Date | null, staleThresholdSeconds = 30): 'FRESH' | 'STALE' | 'UNAVAILABLE' {
    if (!lastLocationAt) {
      return 'UNAVAILABLE';
    }
    const ageSeconds = (Date.now() - lastLocationAt.getTime()) / 1000;
    return ageSeconds <= staleThresholdSeconds ? 'FRESH' : 'STALE';
  }

  private haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Concurrency-safe acceptance of an offered ride request.
   */
  async acceptRide(driverUserId: string, rideId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);

    // Concurrency-safe transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Check Ride state
      const ride = await tx.ride.findUnique({
        where: { id: rideId },
        include: { location: true },
      });

      if (!ride) {
        throw new NotFoundException(`Ride with ID ${rideId} not found`);
      }

      if (ride.driverProfileId !== null || (ride.status !== 'SEARCHING_DRIVER' && ride.status !== 'REQUESTED')) {
        throw new ConflictException('This ride has already been assigned or is no longer available');
      }

      // 2. Check DriverRideRequest
      const rideRequest = await tx.driverRideRequest.findUnique({
        where: {
          rideId_driverProfileId: {
            rideId,
            driverProfileId: profile.id,
          },
        },
      });

      if (!rideRequest || rideRequest.status !== 'PENDING') {
        throw new BadRequestException('No pending ride offer found for this driver');
      }

      if (rideRequest.expiresAt < new Date()) {
        await tx.driverRideRequest.update({
          where: { id: rideRequest.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Ride request has expired');
      }

      const now = new Date();

      // 3. Atomically update Ride assignment only if still unassigned (concurrency guard)
      const updateResult = await tx.ride.updateMany({
        where: {
          id: rideId,
          driverProfileId: null,
          status: { in: ['SEARCHING_DRIVER', 'REQUESTED'] },
        },
        data: {
          driverProfileId: profile.id,
          status: 'DRIVER_ASSIGNED',
          acceptedAt: now,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException('This ride has already been assigned or is no longer available');
      }

      const updatedRide = await tx.ride.findUniqueOrThrow({
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

      // 4. Mark this request as ACCEPTED
      await tx.driverRideRequest.update({
        where: { id: rideRequest.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: now,
        },
      });

      // 5. Transition driver to BUSY
      await tx.driverProfile.update({
        where: { id: profile.id },
        data: { status: DriverStatus.BUSY },
      });

      // 6. Expire any other pending requests for this ride
      await tx.driverRideRequest.updateMany({
        where: {
          rideId,
          driverProfileId: { not: profile.id },
          status: 'PENDING',
        },
        data: { status: 'EXPIRED' },
      });

      return updatedRide;
    });

    // 7. Emit realtime events outside transaction
    this.realtimeService.notifyDriverAccepted(rideId, {
      rideId,
      driverProfileId: profile.id,
      status: 'DRIVER_ASSIGNED',
    });
    this.realtimeService.notifyRideStatusChanged(rideId, result.riderId, 'DRIVER_ASSIGNED', {
      driver: {
        id: profile.id,
        name: `${result.driverProfile?.user.firstName ?? ''} ${result.driverProfile?.user.lastName ?? ''}`.trim(),
        phone: result.driverProfile?.user.phoneNumber,
        vehicle: result.driverProfile?.vehicles[0],
      },
    });

    this.logger.log(`Driver ${profile.id} accepted ride ${rideId}`);
    return result;
  }

  /**
   * Driver rejects ride request. Triggers matching engine for next candidate.
   */
  async rejectRide(driverUserId: string, rideId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);

    const rideRequest = await this.prisma.driverRideRequest.findUnique({
      where: {
        rideId_driverProfileId: {
          rideId,
          driverProfileId: profile.id,
        },
      },
    });

    if (!rideRequest) {
      throw new NotFoundException(`No ride request found for ride ${rideId}`);
    }

    if (rideRequest.status !== 'PENDING') {
      throw new BadRequestException(`Ride request is already ${rideRequest.status}`);
    }

    const now = new Date();
    await this.prisma.driverRideRequest.update({
      where: { id: rideRequest.id },
      data: {
        status: 'REJECTED',
        respondedAt: now,
      },
    });

    this.logger.log(`Driver ${profile.id} rejected ride ${rideId}`);

    // Emit event
    this.realtimeService.notifyDriverRejected(rideId, {
      rideId,
      driverProfileId: profile.id,
    });

    // Attempt next candidate
    await this.attemptNextDriver(rideId);

    return { success: true, message: 'Ride request rejected' };
  }

  /**
   * Get active pending requests for the authenticated driver.
   */
  async getDriverPendingRequests(driverUserId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);

    const requests = await this.prisma.driverRideRequest.findMany({
      where: {
        driverProfileId: profile.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        ride: {
          include: {
            location: true,
            rider: { select: { firstName: true, lastName: true, phoneNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  /**
   * Attempt matching the next eligible driver for a ride.
   * If no more candidates, transitions ride to CANCELLED_NO_DRIVER.
   */
  async attemptNextDriver(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride || ride.status !== 'SEARCHING_DRIVER' || ride.driverProfileId !== null) {
      return null;
    }

    if (!ride.location) {
      this.logger.warn(`Ride ${rideId} has no location data`);
      return null;
    }

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
      // No more drivers available -> transition to CANCELLED_NO_DRIVER
      await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED_NO_DRIVER',
          cancellationReason: 'No available drivers found nearby',
        },
      });

      this.realtimeService.notifyRideStatusChanged(rideId, ride.riderId, 'CANCELLED_NO_DRIVER', {
        reason: 'No available drivers found nearby',
      });

      this.logger.log(`Ride ${rideId} cancelled: CANCELLED_NO_DRIVER`);
      return null;
    }

    const nextDriver = eligible[0]!;
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds expiry

    const newRequest = await this.prisma.driverRideRequest.create({
      data: {
        rideId: ride.id,
        driverProfileId: nextDriver.driverId,
        status: 'PENDING',
        expiresAt,
      },
    });

    this.realtimeService.notifyDriverRideOffered(nextDriver.driverId, {
      requestId: newRequest.id,
      rideId: ride.id,
      pickupAddress: ride.location.pickupAddress,
      dropAddress: ride.location.dropAddress,
      estimatedFare: ride.estimatedFare,
      vehicleType: ride.vehicleTypeId,
      expiresAt: expiresAt.toISOString(),
    });

    this.logger.log(`Offered ride ${rideId} to next candidate driver ${nextDriver.driverId}`);
    return newRequest;
  }

  /**
   * Helper to retrieve full ride details with participants and vehicle.
   */
  async getRideDetails(rideId: string) {
    return this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        location: true,
        driverProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, phoneNumber: true } },
            vehicles: { where: { isActive: true, deletedAt: null } },
          },
        },
        rider: {
          select: { id: true, firstName: true, lastName: true, phoneNumber: true },
        },
      },
    });
  }

  /**
   * Mark that the assigned driver is en route/arriving at the pickup location.
   * Transition: DRIVER_ASSIGNED -> DRIVER_ARRIVING
   */
  async markArriving(driverUserId: string, rideId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.driverProfileId !== profile.id) {
      throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
    }

    if (ride.status === 'DRIVER_ARRIVING') {
      return this.getRideDetails(rideId);
    }

    this.stateMachine.assertValidTransition(ride.status, 'DRIVER_ARRIVING');

    const now = new Date();
    const updateResult = await this.prisma.ride.updateMany({
      where: {
        id: rideId,
        driverProfileId: profile.id,
        status: 'DRIVER_ASSIGNED',
      },
      data: {
        status: 'DRIVER_ARRIVING',
        arrivingAt: now,
      },
    });

    if (updateResult.count === 0) {
      const current = await this.prisma.ride.findUnique({ where: { id: rideId } });
      if (current?.status === 'DRIVER_ARRIVING') {
        return this.getRideDetails(rideId);
      }
      throw new ConflictException(`Cannot transition ride to DRIVER_ARRIVING from status ${current?.status}`);
    }

    this.realtimeService.notifyRideStatusChanged(ride.id, ride.riderId, 'DRIVER_ARRIVING', {
      rideId: ride.id,
      status: 'DRIVER_ARRIVING',
    });

    this.logger.log(`Driver ${profile.id} is now ARRIVING for ride ${rideId}`);
    return this.getRideDetails(rideId);
  }

  /**
   * Mark that the driver has arrived at the pickup location.
   * Transition: DRIVER_ARRIVING -> DRIVER_ARRIVED
   */
  async markArrived(driverUserId: string, rideId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.driverProfileId !== profile.id) {
      throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
    }

    if (ride.status === 'DRIVER_ARRIVED') {
      return this.getRideDetails(rideId);
    }

    this.stateMachine.assertValidTransition(ride.status, 'DRIVER_ARRIVED');

    const now = new Date();
    const updateResult = await this.prisma.ride.updateMany({
      where: {
        id: rideId,
        driverProfileId: profile.id,
        status: { in: ['DRIVER_ARRIVING', 'DRIVER_EN_ROUTE'] },
      },
      data: {
        status: 'DRIVER_ARRIVED',
        driverArrivedAt: now,
      },
    });

    if (updateResult.count === 0) {
      const current = await this.prisma.ride.findUnique({ where: { id: rideId } });
      if (current?.status === 'DRIVER_ARRIVED') {
        return this.getRideDetails(rideId);
      }
      throw new ConflictException(`Cannot transition ride to DRIVER_ARRIVED from status ${current?.status}`);
    }

    this.realtimeService.notifyRideStatusChanged(ride.id, ride.riderId, 'DRIVER_ARRIVED', {
      rideId: ride.id,
      status: 'DRIVER_ARRIVED',
    });

    this.logger.log(`Driver ${profile.id} ARRIVED for ride ${rideId}`);
    return this.getRideDetails(rideId);
  }

  /**
   * Start the ride once the rider has boarded.
   * Transition: DRIVER_ARRIVED -> RIDE_STARTED
   */
  async startRide(driverUserId: string, rideId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.driverProfileId !== profile.id) {
      throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
    }

    if (ride.status === 'RIDE_STARTED' || ride.status === 'RIDE_IN_PROGRESS') {
      return this.getRideDetails(rideId);
    }

    this.stateMachine.assertValidTransition(ride.status, 'RIDE_STARTED');

    const now = new Date();
    const updateResult = await this.prisma.ride.updateMany({
      where: {
        id: rideId,
        driverProfileId: profile.id,
        status: 'DRIVER_ARRIVED',
      },
      data: {
        status: 'RIDE_STARTED',
        startedAt: now,
      },
    });

    if (updateResult.count === 0) {
      const current = await this.prisma.ride.findUnique({ where: { id: rideId } });
      if (current?.status === 'RIDE_STARTED' || current?.status === 'RIDE_IN_PROGRESS') {
        return this.getRideDetails(rideId);
      }
      throw new ConflictException(`Cannot start ride from status ${current?.status}`);
    }

    this.realtimeService.notifyRideStatusChanged(ride.id, ride.riderId, 'RIDE_STARTED', {
      rideId: ride.id,
      status: 'RIDE_STARTED',
    });

    this.logger.log(`Ride ${rideId} STARTED by driver ${profile.id}`);
    return this.getRideDetails(rideId);
  }

  /**
   * Complete the active ride and advance to PAYMENT_PENDING.
   * Transition: RIDE_STARTED -> RIDE_COMPLETED -> PAYMENT_PENDING
   * IMPORTANT: In Phase 5A, ride ends at PAYMENT_PENDING and driver remains BUSY.
   */
  async completeRide(driverUserId: string, rideId: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.driverProfileId !== profile.id) {
      throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
    }

    if (ride.status === 'PAYMENT_PENDING') {
      return this.getRideDetails(rideId);
    }

    this.stateMachine.assertValidTransition(ride.status, 'RIDE_COMPLETED');

    const now = new Date();
    const updateResult = await this.prisma.ride.updateMany({
      where: {
        id: rideId,
        driverProfileId: profile.id,
        status: { in: ['RIDE_STARTED', 'RIDE_IN_PROGRESS'] },
      },
      data: {
        status: 'PAYMENT_PENDING',
        completedAt: now,
      },
    });

    if (updateResult.count === 0) {
      const current = await this.prisma.ride.findUnique({ where: { id: rideId } });
      if (current?.status === 'PAYMENT_PENDING') {
        return this.getRideDetails(rideId);
      }
      throw new ConflictException(`Cannot complete ride from status ${current?.status}`);
    }

    // Driver remains BUSY pending payment in Phase 5B
    await this.prisma.driverProfile.update({
      where: { id: profile.id },
      data: { status: DriverStatus.BUSY },
    });

    // Emit realtime notifications
    this.realtimeService.notifyRideStatusChanged(ride.id, ride.riderId, 'RIDE_COMPLETED', {
      rideId: ride.id,
      status: 'RIDE_COMPLETED',
    });
    this.realtimeService.notifyRideStatusChanged(ride.id, ride.riderId, 'PAYMENT_PENDING', {
      rideId: ride.id,
      status: 'PAYMENT_PENDING',
    });

    this.logger.log(`Ride ${rideId} completed and marked PAYMENT_PENDING. Driver ${profile.id} remains BUSY`);
    return this.getRideDetails(rideId);
  }

  /**
   * Driver cancels an assigned ride before it starts.
   * Resets driver status back to ONLINE_AVAILABLE.
   */
  async cancelDriverRide(driverUserId: string, rideId: string, reason?: string) {
    const profile = await this.getDriverProfileByUserId(driverUserId);
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride with ID ${rideId} not found`);
    }

    if (ride.driverProfileId !== profile.id) {
      throw new ForbiddenException('Access denied: You are not the assigned driver for this ride');
    }

    this.stateMachine.assertDriverCanCancel(ride.status);

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED_BY_DRIVER',
          cancelledAt: now,
          cancellationReason: reason || 'Cancelled by driver',
        },
      });

      // Free driver back to ONLINE_AVAILABLE
      await tx.driverProfile.update({
        where: { id: profile.id },
        data: { status: DriverStatus.ONLINE_AVAILABLE },
      });
    });

    this.realtimeService.notifyRideStatusChanged(ride.id, ride.riderId, 'CANCELLED_BY_DRIVER', {
      rideId: ride.id,
      reason: reason || 'Cancelled by driver',
    });

    this.logger.log(`Ride ${rideId} CANCELLED_BY_DRIVER. Driver ${profile.id} is now ONLINE_AVAILABLE`);
    return this.getRideDetails(rideId);
  }
}

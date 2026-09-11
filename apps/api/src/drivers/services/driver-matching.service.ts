import { Injectable, Logger } from '@nestjs/common';
import {
  DriverMatchParams,
  DriverResponse,
  IDriverMatchingService,
  MatchedDriver,
} from '@yatra-seva/service-contracts';
import { LatLng, VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { MockRoutingService } from '../../providers/mock/mock-map.service';

export interface ExtendedDriverMatchParams extends DriverMatchParams {
  excludeDriverProfileIds?: string[];
  rideId?: string;
}

@Injectable()
export class DriverMatchingService implements IDriverMatchingService {
  private readonly logger = new Logger(DriverMatchingService.name);
  private readonly defaultRadiusMeters = 10000; // 10 km default

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockRoutingService: MockRoutingService,
  ) {}

  /**
   * Find eligible drivers near a pickup location ranked by distance.
   */
  async findEligibleDrivers(params: ExtendedDriverMatchParams): Promise<MatchedDriver[]> {
    const radiusMeters = params.radiusMeters ?? this.defaultRadiusMeters;

    // Build exclusion list: explicitly excluded + drivers who already responded (REJECTED/EXPIRED)
    const excludedIds = new Set<string>(params.excludeDriverProfileIds ?? []);

    if (params.rideId) {
      const priorRequests = await this.prisma.driverRideRequest.findMany({
        where: {
          rideId: params.rideId,
          status: { in: ['REJECTED', 'EXPIRED'] },
        },
        select: { driverProfileId: true },
      });
      for (const req of priorRequests) {
        excludedIds.add(req.driverProfileId);
      }
    }

    const staleThresholdSeconds = parseInt(process.env.LOCATION_STALE_AFTER_SECONDS || '300', 10);
    const staleCutoff = new Date(Date.now() - staleThresholdSeconds * 1000);

    // Query candidate drivers from Neon PostgreSQL
    const candidateDrivers = await this.prisma.driverProfile.findMany({
      where: {
        status: { in: ['ONLINE_AVAILABLE', 'ONLINE'] },
        isVerified: true,
        isOnboarded: true,
        deletedAt: null,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        lastLocationAt: { gte: staleCutoff },
        ...(params.cityId ? { cityId: params.cityId } : {}),
        id: excludedIds.size > 0 ? { notIn: Array.from(excludedIds) } : undefined,
        vehicles: {
          some: {
            isActive: true,
            deletedAt: null,
            vehicleType: {
              name: params.vehicleType,
            },
          },
        },
      },
      include: {
        vehicles: {
          where: { isActive: true, deletedAt: null },
          include: { vehicleType: true },
        },
      },
    });

    this.logger.log(
      `Found ${candidateDrivers.length} candidate drivers for vehicle ${params.vehicleType} in city ${params.cityId}`,
    );

    const eligibleList: MatchedDriver[] = [];

    for (const driver of candidateDrivers) {
      if (driver.currentLatitude === null || driver.currentLongitude === null) {
        continue;
      }

      const driverLocation: LatLng = {
        latitude: driver.currentLatitude,
        longitude: driver.currentLongitude,
      };

      const route = await this.mockRoutingService.getRoute(driverLocation, params.pickupLocation);

      if (route.distanceMeters <= radiusMeters) {
        eligibleList.push({
          driverId: driver.id,
          distanceMeters: route.distanceMeters,
          estimatedArrivalSeconds: route.durationSeconds,
          location: driverLocation,
        });
      }
    }

    // Deterministic ranking: primarily by distance, break ties by driver ID
    eligibleList.sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return a.driverId.localeCompare(b.driverId);
    });

    return eligibleList;
  }

  /**
   * Contract stub for IDriverMatchingService.sendRideRequest.
   * Real persistence and dispatch are managed through DriversService and RidesService.
   */
  async sendRideRequest(driverId: string, rideId: string): Promise<DriverResponse> {
    const existing = await this.prisma.driverRideRequest.findUnique({
      where: {
        rideId_driverProfileId: {
          rideId,
          driverProfileId: driverId,
        },
      },
    });

    if (existing?.status === 'ACCEPTED') {
      return { accepted: true, driverId };
    }
    if (existing?.status === 'REJECTED') {
      return { accepted: false, driverId, reason: 'REJECTED' };
    }
    if (existing?.status === 'EXPIRED') {
      return { accepted: false, driverId, reason: 'TIMEOUT' };
    }

    return { accepted: false, driverId, reason: 'UNAVAILABLE' };
  }
}

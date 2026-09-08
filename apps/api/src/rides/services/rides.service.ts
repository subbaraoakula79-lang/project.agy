import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Address, FareEstimate, RideStatus, UserRole, VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { FareService } from '../../fare/fare.service';
import { MockMapService, MockRoutingService } from '../../providers/mock/mock-map.service';
import { CreateRideDto } from '../dto/create-ride.dto';
import { FareEstimateQueryDto } from '../dto/fare-estimate-query.dto';

export interface RideRecord {
  id: string;
  riderId: string;
  driverProfileId: string | null;
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
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fareService: FareService,
    private readonly mockMapService: MockMapService,
    private readonly mockRoutingService: MockRoutingService,
  ) {}

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

  /** Create a new ride request via Prisma/PostgreSQL only. Initial status is strictly REQUESTED. */
  async createRide(riderId: string, userRole: UserRole, dto: CreateRideDto): Promise<RideRecord> {
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

    // Create ride directly in PostgreSQL via Prisma Client
    const created = await this.prisma.ride.create({
      data: {
        riderId,
        driverProfileId: null, // No driver assigned in Phase 3
        vehicleTypeId: dto.vehicleType,
        cityId: 'd75253d1-4456-42c6-8483-e726bd20d156',
        status: RideStatus.REQUESTED, // Strictly REQUESTED
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

    console.log(`🚗 [RidesService] Ride created in PostgreSQL: ${created.id} (status: ${created.status})`);

    return this.mapPrismaRideToRecord(created);
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
      include: { location: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride not found with ID: ${rideId}`);
    }

    // Ownership check: Rider can only access their own rides
    if (userRole === UserRole.RIDER && ride.riderId !== requestingUserId) {
      throw new ForbiddenException('Access denied: You can only access your own ride requests');
    }

    return this.mapPrismaRideToRecord(ride);
  }

  /** Helper to map Prisma Ride object to RideRecord contract. */
  private mapPrismaRideToRecord(ride: any): RideRecord {
    return {
      id: ride.id,
      riderId: ride.riderId,
      driverProfileId: ride.driverProfileId,
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
      createdAt: ride.createdAt ? new Date(ride.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: ride.updatedAt ? new Date(ride.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}

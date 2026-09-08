import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Address, FareEstimate, RideStatus, UserRole, VehicleType } from '@yatra-seva/shared-types';
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
  private readonly ridesMap: Map<string, RideRecord> = new Map();

  constructor(
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
      cityId: 'kakinada-city-id',
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    });
  }

  /** Create a new ride request. Initial status is strictly REQUESTED. */
  async createRide(riderId: string, userRole: UserRole, dto: CreateRideDto): Promise<RideRecord> {
    if (userRole !== UserRole.RIDER) {
      throw new ForbiddenException('Only riders can request rides');
    }

    const origin = { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude };
    const destination = { latitude: dto.dropLatitude, longitude: dto.dropLongitude };

    const route = await this.mockRoutingService.getRoute(origin, destination);
    const fareEstimate = await this.fareService.calculateFare({
      cityId: 'kakinada-city-id',
      vehicleType: dto.vehicleType,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    });

    const now = new Date().toISOString();
    const rideId = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const ride: RideRecord = {
      id: rideId,
      riderId,
      driverProfileId: null, // No driver assigned in Phase 3
      vehicleTypeId: dto.vehicleType,
      vehicleType: dto.vehicleType,
      cityId: 'kakinada-city-id',
      status: RideStatus.REQUESTED, // Strictly REQUESTED
      paymentMethod: dto.paymentMethod,
      estimatedFare: fareEstimate.totalFare,
      estimatedDistanceMeters: route.distanceMeters,
      estimatedDurationSeconds: route.durationSeconds,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      pickupAddress: dto.pickupAddress,
      dropLatitude: dto.dropLatitude,
      dropLongitude: dto.dropLongitude,
      dropAddress: dto.dropAddress,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.ridesMap.set(ride.id, ride);
    console.log(`🚗 [RidesService] Ride requested: ${ride.id} (${ride.vehicleType}, ₹${ride.estimatedFare})`);
    return ride;
  }

  /** Get all rides requested by the authenticated rider (enforces ownership). */
  async getRiderRides(riderId: string, userRole: UserRole): Promise<RideRecord[]> {
    if (userRole !== UserRole.RIDER) {
      throw new ForbiddenException('Only riders can list their rides');
    }

    const rides: RideRecord[] = [];
    for (const ride of this.ridesMap.values()) {
      if (ride.riderId === riderId) {
        rides.push(ride);
      }
    }
    return rides.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  /** Get a specific ride by ID (enforces ownership). */
  async getRideById(rideId: string, requestingUserId: string, userRole: UserRole): Promise<RideRecord> {
    const ride = this.ridesMap.get(rideId);
    if (!ride) {
      throw new NotFoundException(`Ride not found with ID: ${rideId}`);
    }

    // Ownership check: Rider can only access their own rides
    if (userRole === UserRole.RIDER && ride.riderId !== requestingUserId) {
      throw new ForbiddenException('Access denied: You can only access your own ride requests');
    }

    return ride;
  }
}

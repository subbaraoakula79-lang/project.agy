import { LatLng } from '@yatra-seva/shared-types';
import { VehicleType } from '@yatra-seva/shared-types';

/**
 * Driver matching service contract.
 *
 * Finds and assigns the best available driver for a ride request.
 * MVP uses a simple proximity-based deterministic algorithm.
 */
export interface IDriverMatchingService {
  /**
   * Find eligible drivers near a pickup location.
   *
   * Steps (MVP algorithm):
   * 1. Filter online + available drivers
   * 2. Filter by compatible vehicle type
   * 3. Filter by radius from pickup
   * 4. Rank by distance (closest first)
   * 5. Return ranked list
   */
  findEligibleDrivers(params: DriverMatchParams): Promise<MatchedDriver[]>;

  /**
   * Send a ride request to a specific driver.
   * Returns whether the driver accepted.
   * Handles timeout if driver doesn't respond.
   */
  sendRideRequest(driverId: string, rideId: string): Promise<DriverResponse>;
}

export interface DriverMatchParams {
  pickupLocation: LatLng;
  vehicleType: VehicleType;
  cityId: string;
  /** Maximum search radius in meters. Default: 5000. */
  radiusMeters?: number;
}

export interface MatchedDriver {
  driverId: string;
  distanceMeters: number;
  estimatedArrivalSeconds: number;
  location: LatLng;
}

export interface DriverResponse {
  accepted: boolean;
  driverId: string;
  /** If rejected/timed out, reason code. */
  reason?: 'ACCEPTED' | 'REJECTED' | 'TIMEOUT' | 'UNAVAILABLE';
}

import { LatLng, FareEstimate } from '@yatra-seva/shared-types';
import { VehicleType } from '@yatra-seva/shared-types';

/**
 * Fare calculation service contract.
 *
 * Calculates ride fare estimates based on distance, time, vehicle type,
 * city pricing configuration, and surge multiplier.
 */
export interface IFareService {
  /**
   * Calculate fare estimate for a ride.
   */
  calculateFare(params: FareCalculationParams): Promise<FareEstimate>;

  /**
   * Calculate fare estimates for all available vehicle types.
   */
  calculateAllFares(params: Omit<FareCalculationParams, 'vehicleType'>): Promise<FareEstimate[]>;
}

export interface FareCalculationParams {
  cityId: string;
  vehicleType: VehicleType;
  distanceMeters: number;
  durationSeconds: number;
  /** Override surge multiplier (defaults to 1.0). */
  surgeMultiplier?: number;
}

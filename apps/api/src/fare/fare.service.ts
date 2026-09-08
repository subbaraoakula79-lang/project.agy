import { BadRequestException, Injectable } from '@nestjs/common';
import { FareCalculationParams, IFareService } from '@yatra-seva/service-contracts';
import { FareEstimate, VehicleType } from '@yatra-seva/shared-types';

export interface VehiclePricingRule {
  baseFare: number;
  perKmRate: number;
  perMinRate: number;
  minimumFare: number;
}

const KAKINADA_PRICING: Record<VehicleType, VehiclePricingRule> = {
  [VehicleType.BIKE]: {
    baseFare: 20,
    perKmRate: 8,
    perMinRate: 1,
    minimumFare: 30,
  },
  [VehicleType.AUTO]: {
    baseFare: 30,
    perKmRate: 12,
    perMinRate: 1.5,
    minimumFare: 40,
  },
  [VehicleType.CAB]: {
    baseFare: 50,
    perKmRate: 18,
    perMinRate: 2,
    minimumFare: 80,
  },
};

@Injectable()
export class FareService implements IFareService {
  async calculateFare(params: FareCalculationParams): Promise<FareEstimate> {
    const { vehicleType, distanceMeters, durationSeconds, surgeMultiplier = 1.0 } = params;

    const rule = KAKINADA_PRICING[vehicleType];
    if (!rule) {
      throw new BadRequestException(`Invalid or unsupported vehicle type: ${vehicleType}`);
    }

    const distanceKm = Math.max(0, distanceMeters) / 1000;
    const durationMinutes = Math.max(0, durationSeconds) / 60;

    const distanceCharge = distanceKm * rule.perKmRate;
    const timeCharge = durationMinutes * rule.perMinRate;
    const subtotal = rule.baseFare + distanceCharge + timeCharge;

    const surggedSubtotal = subtotal * Math.max(1.0, surgeMultiplier);
    const totalFare = Math.max(rule.minimumFare, Math.round(surggedSubtotal));

    return {
      vehicleType,
      baseFare: rule.baseFare,
      distanceCharge: Math.round(distanceCharge),
      timeCharge: Math.round(timeCharge),
      surgeMultiplier,
      totalFare,
      currency: 'INR',
      estimatedDistanceKm: parseFloat(distanceKm.toFixed(2)),
      estimatedDurationMinutes: Math.ceil(durationMinutes),
    };
  }

  async calculateAllFares(
    params: Omit<FareCalculationParams, 'vehicleType'>,
  ): Promise<FareEstimate[]> {
    const vehicleTypes = [VehicleType.BIKE, VehicleType.AUTO, VehicleType.CAB];
    const estimates: FareEstimate[] = [];

    for (const vehicleType of vehicleTypes) {
      const estimate = await this.calculateFare({ ...params, vehicleType });
      estimates.push(estimate);
    }

    return estimates;
  }
}

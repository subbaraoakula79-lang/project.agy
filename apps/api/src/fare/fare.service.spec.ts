import { BadRequestException } from '@nestjs/common';
import { VehicleType } from '@yatra-seva/shared-types';
import { FareService } from './fare.service';

describe('FareService', () => {
  let fareService: FareService;

  beforeEach(() => {
    fareService = new FareService();
  });

  it('should calculate BIKE fare correctly', async () => {
    // 5 km (5000m), 12 min (720s)
    // Base: 20, dist: 5*8 = 40, time: 12*1 = 12 => subtotal: 72, total: 72
    const estimate = await fareService.calculateFare({
      cityId: 'kakinada',
      vehicleType: VehicleType.BIKE,
      distanceMeters: 5000,
      durationSeconds: 720,
    });

    expect(estimate.vehicleType).toBe(VehicleType.BIKE);
    expect(estimate.totalFare).toBe(72);
    expect(estimate.estimatedDistanceKm).toBe(5);
    expect(estimate.estimatedDurationMinutes).toBe(12);
  });

  it('should calculate AUTO fare correctly', async () => {
    // 5 km, 12 min
    // Base: 30, dist: 5*12 = 60, time: 12*1.5 = 18 => subtotal: 108
    const estimate = await fareService.calculateFare({
      cityId: 'kakinada',
      vehicleType: VehicleType.AUTO,
      distanceMeters: 5000,
      durationSeconds: 720,
    });

    expect(estimate.vehicleType).toBe(VehicleType.AUTO);
    expect(estimate.totalFare).toBe(108);
  });

  it('should calculate CAB fare correctly', async () => {
    // 5 km, 12 min
    // Base: 50, dist: 5*18 = 90, time: 12*2 = 24 => subtotal: 164
    const estimate = await fareService.calculateFare({
      cityId: 'kakinada',
      vehicleType: VehicleType.CAB,
      distanceMeters: 5000,
      durationSeconds: 720,
    });

    expect(estimate.vehicleType).toBe(VehicleType.CAB);
    expect(estimate.totalFare).toBe(164);
  });

  it('should enforce minimum fare when distance is short', async () => {
    // BIKE 500m (0.5km), 2 min (120s)
    // Base: 20 + 4 + 2 = 26 < Min 30
    const estimate = await fareService.calculateFare({
      cityId: 'kakinada',
      vehicleType: VehicleType.BIKE,
      distanceMeters: 500,
      durationSeconds: 120,
    });

    expect(estimate.totalFare).toBe(30);
  });

  it('should calculate all vehicle fares in a single call', async () => {
    const estimates = await fareService.calculateAllFares({
      cityId: 'kakinada',
      distanceMeters: 3000,
      durationSeconds: 600,
    });

    expect(estimates).toHaveLength(3);
    const types = estimates.map((e) => e.vehicleType);
    expect(types).toContain(VehicleType.BIKE);
    expect(types).toContain(VehicleType.AUTO);
    expect(types).toContain(VehicleType.CAB);
  });

  it('should throw BadRequestException for invalid vehicle type', async () => {
    await expect(
      fareService.calculateFare({
        cityId: 'kakinada',
        vehicleType: 'HELICOPTER' as VehicleType,
        distanceMeters: 1000,
        durationSeconds: 60,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

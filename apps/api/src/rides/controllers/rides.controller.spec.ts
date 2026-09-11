import { PaymentMethod, VehicleType } from '@yatra-seva/shared-types';
import { PrismaService } from '../../database/prisma.service';
import { FareService } from '../../fare/fare.service';
import { MockMapService, MockRoutingService } from '../../providers/mock/mock-map.service';
import { RidesController } from './rides.controller';
import { RidesService } from '../services/rides.service';

describe('RidesController', () => {
  let controller: RidesController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      ride: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    };
    const fareService = new FareService();
    const mockMapService = new MockMapService();
    const mockRoutingService = new MockRoutingService();
    const service = new RidesService(
      mockPrisma as unknown as PrismaService,
      fareService,
      mockMapService,
      mockRoutingService,
    );
    const mockDriversService = {
      getDriverLocationForRide: jest.fn(),
    };
    controller = new RidesController(service, mockDriversService as any);
  });

  it('should return Kakinada mock locations list', async () => {
    const res = await controller.getLocations();
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('should calculate fare estimates for all vehicle types', async () => {
    const res = await controller.getEstimates({
      pickupLatitude: 16.9558,
      pickupLongitude: 82.2386,
      dropLatitude: 16.9891,
      dropLongitude: 82.2475,
    });

    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(3);
  });

  it('should get active ride', async () => {
    mockPrisma.ride.findFirst = jest.fn().mockResolvedValue({
      id: 'ride-1',
      status: 'DRIVER_ARRIVING',
      location: {},
    });
    const res = await controller.getActiveRide('user-1', 'RIDER' as any);
    expect(res.success).toBe(true);
    expect(res.data?.id).toBe('ride-1');
  });

  it('should cancel ride for rider', async () => {
    mockPrisma.ride.findUnique = jest.fn().mockResolvedValue({
      id: 'ride-1',
      riderId: 'user-1',
      status: 'DRIVER_ASSIGNED',
      driverProfileId: 'driver-1',
      location: {},
    });
    mockPrisma.driverProfile = { update: jest.fn() };
    mockPrisma.driverRideRequest = { updateMany: jest.fn() };
    mockPrisma.$transaction = jest.fn((cb: any) => cb(mockPrisma));
    mockPrisma.ride.update = jest.fn().mockResolvedValue({
      id: 'ride-1',
      riderId: 'user-1',
      status: 'CANCELLED_BY_RIDER',
      location: {},
    });

    const res = await controller.cancelRide('ride-1', 'user-1', 'Changed plan');
    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('CANCELLED_BY_RIDER');
  });
});

import { DriversController } from './drivers.controller';
import { DriversService } from '../services/drivers.service';

describe('DriversController', () => {
  let controller: DriversController;
  let mockDriversService: any;

  beforeEach(() => {
    mockDriversService = {
      updateLocation: jest.fn().mockResolvedValue({ latitude: 16.9558, longitude: 82.2386 }),
      setOnline: jest.fn().mockResolvedValue({ status: 'ONLINE_AVAILABLE', hasActiveVehicle: true }),
      setOffline: jest.fn().mockResolvedValue({ status: 'OFFLINE', hasActiveVehicle: true }),
      getAvailability: jest.fn().mockResolvedValue({ status: 'ONLINE_AVAILABLE', hasActiveVehicle: true }),
      acceptRide: jest.fn().mockResolvedValue({ id: 'ride-1', status: 'DRIVER_ASSIGNED' }),
      rejectRide: jest.fn().mockResolvedValue({ success: true }),
      getDriverPendingRequests: jest.fn().mockResolvedValue([]),
    };

    controller = new DriversController(mockDriversService as unknown as DriversService);
  });

  it('should update location', async () => {
    const res = await controller.updateLocation('user-d1', { latitude: 16.9558, longitude: 82.2386 });
    expect(res.success).toBe(true);
    expect(mockDriversService.updateLocation).toHaveBeenCalledWith('user-d1', { latitude: 16.9558, longitude: 82.2386 });
  });

  it('should toggle online availability', async () => {
    const res = await controller.setOnline('user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.setOnline).toHaveBeenCalledWith('user-d1');
  });

  it('should toggle offline availability', async () => {
    const res = await controller.setOffline('user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.setOffline).toHaveBeenCalledWith('user-d1');
  });

  it('should accept ride', async () => {
    const res = await controller.acceptRide('ride-1', 'user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.acceptRide).toHaveBeenCalledWith('user-d1', 'ride-1');
  });

  it('should mark ride arriving', async () => {
    mockDriversService.markArriving = jest.fn().mockResolvedValue({ id: 'ride-1', status: 'DRIVER_ARRIVING' });
    const res = await controller.markArriving('ride-1', 'user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.markArriving).toHaveBeenCalledWith('user-d1', 'ride-1');
  });

  it('should mark ride arrived', async () => {
    mockDriversService.markArrived = jest.fn().mockResolvedValue({ id: 'ride-1', status: 'DRIVER_ARRIVED' });
    const res = await controller.markArrived('ride-1', 'user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.markArrived).toHaveBeenCalledWith('user-d1', 'ride-1');
  });

  it('should start ride', async () => {
    mockDriversService.startRide = jest.fn().mockResolvedValue({ id: 'ride-1', status: 'RIDE_STARTED' });
    const res = await controller.startRide('ride-1', 'user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.startRide).toHaveBeenCalledWith('user-d1', 'ride-1');
  });

  it('should complete ride', async () => {
    mockDriversService.completeRide = jest.fn().mockResolvedValue({ id: 'ride-1', status: 'PAYMENT_PENDING' });
    const res = await controller.completeRide('ride-1', 'user-d1');
    expect(res.success).toBe(true);
    expect(mockDriversService.completeRide).toHaveBeenCalledWith('user-d1', 'ride-1');
  });

  it('should cancel ride', async () => {
    mockDriversService.cancelDriverRide = jest.fn().mockResolvedValue({ id: 'ride-1', status: 'CANCELLED_BY_DRIVER' });
    const res = await controller.cancelRide('ride-1', 'user-d1', 'Vehicle issue');
    expect(res.success).toBe(true);
    expect(mockDriversService.cancelDriverRide).toHaveBeenCalledWith('user-d1', 'ride-1', 'Vehicle issue');
  });
});

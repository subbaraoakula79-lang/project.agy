import { REALTIME_EVENTS } from '@yatra-seva/shared-types';
import { RealtimeService } from './realtime.service';
import { RidesGateway } from './rides.gateway';

describe('RealtimeService', () => {
  let realtimeService: RealtimeService;
  let mockGateway: any;
  let mockServer: any;

  beforeEach(() => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockGateway = {
      server: mockServer,
    };

    realtimeService = new RealtimeService(mockGateway as unknown as RidesGateway);
  });

  it('should emit ride offer only to the specific driver room', () => {
    realtimeService.notifyDriverRideOffered('driver-prof-123', {
      rideId: 'ride-1',
      fare: 76,
    });

    expect(mockServer.to).toHaveBeenCalledWith('driver:driver-prof-123');
    expect(mockServer.emit).toHaveBeenCalledWith(REALTIME_EVENTS.DRIVER_RIDE_REQUESTED, {
      rideId: 'ride-1',
      fare: 76,
    });
  });

  it('should emit driver acceptance to the specific ride room', () => {
    realtimeService.notifyDriverAccepted('ride-1', {
      driverProfileId: 'driver-prof-123',
    });

    expect(mockServer.to).toHaveBeenCalledWith('ride:ride-1');
    expect(mockServer.emit).toHaveBeenCalledWith(REALTIME_EVENTS.DRIVER_ACCEPTED, {
      driverProfileId: 'driver-prof-123',
    });
  });

  it('should emit status change to both ride room and rider private room', () => {
    realtimeService.notifyRideStatusChanged('ride-1', 'rider-user-1', 'SEARCHING_DRIVER');

    expect(mockServer.to).toHaveBeenCalledWith('ride:ride-1');
    expect(mockServer.to).toHaveBeenCalledWith('user:rider-user-1');
    expect(mockServer.emit).toHaveBeenCalledWith(
      REALTIME_EVENTS.RIDE_STATUS_CHANGED,
      expect.objectContaining({
        rideId: 'ride-1',
        status: 'SEARCHING_DRIVER',
      }),
    );
  });

  it('should emit driver location updates only to the active ride room', () => {
    realtimeService.notifyDriverLocationUpdated('ride-1', {
      latitude: 16.9558,
      longitude: 82.2386,
    });

    expect(mockServer.to).toHaveBeenCalledWith('ride:ride-1');
    expect(mockServer.emit).toHaveBeenCalledWith(
      REALTIME_EVENTS.DRIVER_LOCATION_UPDATED,
      expect.objectContaining({
        rideId: 'ride-1',
        latitude: 16.9558,
        longitude: 82.2386,
      }),
    );
  });
});

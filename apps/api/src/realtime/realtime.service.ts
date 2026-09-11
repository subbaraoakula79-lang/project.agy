import { Injectable, Logger } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
import { REALTIME_EVENTS } from '@yatra-seva/shared-types';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(private readonly gateway: RidesGateway) {}

  /** Emit to a specific user */
  emitToUser(userId: string, event: string, payload: any) {
    try {
      if (this.gateway.server) {
        this.gateway.server.to(`user:${userId}`).emit(event, payload);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to emit to user:${userId}: ${err.message}`);
    }
  }

  /** Emit to a specific driver profile room */
  emitToDriver(driverProfileId: string, event: string, payload: any) {
    try {
      if (this.gateway.server) {
        this.gateway.server.to(`driver:${driverProfileId}`).emit(event, payload);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to emit to driver:${driverProfileId}: ${err.message}`);
    }
  }

  /** Emit to all participants in a ride room */
  emitToRide(rideId: string, event: string, payload: any) {
    try {
      if (this.gateway.server) {
        this.gateway.server.to(`ride:${rideId}`).emit(event, payload);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to emit to ride:${rideId}: ${err.message}`);
    }
  }

  /** Notify driver of an incoming ride offer */
  notifyDriverRideOffered(driverProfileId: string, offer: any) {
    this.emitToDriver(driverProfileId, REALTIME_EVENTS.DRIVER_RIDE_REQUESTED, offer);
  }

  /** Notify ride room when driver accepts */
  notifyDriverAccepted(rideId: string, assignment: any) {
    this.emitToRide(rideId, REALTIME_EVENTS.DRIVER_ACCEPTED, assignment);
  }

  /** Notify ride room when driver rejects */
  notifyDriverRejected(rideId: string, rejection: any) {
    this.emitToRide(rideId, REALTIME_EVENTS.DRIVER_REJECTED, rejection);
  }

  /** Notify ride room and rider when status changes */
  notifyRideStatusChanged(rideId: string, riderId: string, status: string, details?: any) {
    const payload = { rideId, status, ...details, timestamp: new Date().toISOString() };
    this.emitToRide(rideId, REALTIME_EVENTS.RIDE_STATUS_CHANGED, payload);
    this.emitToUser(riderId, REALTIME_EVENTS.RIDE_STATUS_CHANGED, payload);
  }

  /** Notify ride room when assigned driver's location updates */
  notifyDriverLocationUpdated(
    rideId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
      recordedAt?: string;
    },
  ) {
    this.emitToRide(rideId, REALTIME_EVENTS.DRIVER_LOCATION_UPDATED, {
      rideId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy ?? null,
      heading: location.heading ?? null,
      speed: location.speed ?? null,
      recordedAt: location.recordedAt ?? new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      freshness: 'FRESH',
    });
  }
}

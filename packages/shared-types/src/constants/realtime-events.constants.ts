/**
 * Socket.IO Realtime Event Names for YatraSeva platform.
 */
export const REALTIME_EVENTS = {
  // Ride lifecycle events
  RIDE_REQUESTED: 'ride:requested',
  RIDE_STATUS_CHANGED: 'ride:status:changed',

  // Driver ride request / offer events
  DRIVER_RIDE_REQUESTED: 'driver:ride:requested',
  DRIVER_ACCEPTED: 'driver:accepted',
  DRIVER_REJECTED: 'driver:rejected',

  // Driver location updates
  DRIVER_LOCATION_UPDATED: 'driver:location:updated',
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

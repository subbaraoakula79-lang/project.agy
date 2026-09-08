/**
 * Ride lifecycle states.
 *
 * Transitions are enforced by the RideStateMachine — never set
 * ride status directly; always go through the state machine.
 */
export enum RideStatus {
  /** Rider submitted a booking request. */
  REQUESTED = 'REQUESTED',

  /** System is actively searching for a driver. */
  SEARCHING_DRIVER = 'SEARCHING_DRIVER',

  /** A driver accepted the ride request. */
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',

  /** Driver is navigating to the pickup location. */
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',

  /** Driver has arrived at the pickup location. */
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',

  /** Ride is actively underway. */
  RIDE_IN_PROGRESS = 'RIDE_IN_PROGRESS',

  /** Ride finished, awaiting payment processing. */
  RIDE_COMPLETED = 'RIDE_COMPLETED',

  /** Payment initiated but not yet confirmed. */
  PAYMENT_PENDING = 'PAYMENT_PENDING',

  /** Payment attempt failed — needs retry or alternate method. */
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  /** Ride fully settled — terminal state. */
  COMPLETED = 'COMPLETED',

  /** Rider cancelled the ride. */
  CANCELLED_BY_RIDER = 'CANCELLED_BY_RIDER',

  /** Driver cancelled after accepting. */
  CANCELLED_BY_DRIVER = 'CANCELLED_BY_DRIVER',

  /** No driver found within the search timeout. */
  CANCELLED_NO_DRIVER = 'CANCELLED_NO_DRIVER',
}

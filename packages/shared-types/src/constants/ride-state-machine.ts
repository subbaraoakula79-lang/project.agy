import { RideStatus } from '../enums/ride-status.enum';

/**
 * Ride State Machine — defines legal state transitions.
 *
 * This is the single source of truth for what transitions are valid.
 * The backend ride service MUST validate transitions through this map
 * before updating ride status.
 *
 * Key: current state
 * Value: set of states that can be transitioned TO
 */
export const RIDE_STATE_TRANSITIONS: ReadonlyMap<RideStatus, ReadonlySet<RideStatus>> = new Map([
  [
    RideStatus.REQUESTED,
    new Set([RideStatus.SEARCHING_DRIVER, RideStatus.CANCELLED_BY_RIDER]),
  ],
  [
    RideStatus.SEARCHING_DRIVER,
    new Set([
      RideStatus.DRIVER_ASSIGNED,
      RideStatus.CANCELLED_BY_RIDER,
      RideStatus.CANCELLED_NO_DRIVER,
    ]),
  ],
  [
    RideStatus.DRIVER_ASSIGNED,
    new Set([
      RideStatus.DRIVER_EN_ROUTE,
      RideStatus.CANCELLED_BY_RIDER,
      RideStatus.CANCELLED_BY_DRIVER,
    ]),
  ],
  [
    RideStatus.DRIVER_EN_ROUTE,
    new Set([
      RideStatus.DRIVER_ARRIVED,
      RideStatus.CANCELLED_BY_RIDER,
      RideStatus.CANCELLED_BY_DRIVER,
    ]),
  ],
  [
    RideStatus.DRIVER_ARRIVED,
    new Set([
      RideStatus.RIDE_IN_PROGRESS,
      RideStatus.CANCELLED_BY_RIDER,
      RideStatus.CANCELLED_BY_DRIVER,
    ]),
  ],
  [
    RideStatus.RIDE_IN_PROGRESS,
    new Set([RideStatus.RIDE_COMPLETED]),
  ],
  [
    RideStatus.RIDE_COMPLETED,
    new Set([RideStatus.PAYMENT_PENDING, RideStatus.COMPLETED]),
  ],
  [
    RideStatus.PAYMENT_PENDING,
    new Set([RideStatus.COMPLETED, RideStatus.PAYMENT_FAILED]),
  ],
  [
    RideStatus.PAYMENT_FAILED,
    new Set([RideStatus.PAYMENT_PENDING, RideStatus.COMPLETED]),
  ],
  // Terminal states — no transitions out
  [RideStatus.COMPLETED, new Set()],
  [RideStatus.CANCELLED_BY_RIDER, new Set()],
  [RideStatus.CANCELLED_BY_DRIVER, new Set()],
  [RideStatus.CANCELLED_NO_DRIVER, new Set()],
]);

/**
 * Validates whether a ride status transition is legal.
 *
 * @param from - Current ride status
 * @param to - Desired next status
 * @returns true if the transition is allowed
 */
export function isValidRideTransition(from: RideStatus, to: RideStatus): boolean {
  const allowedTransitions = RIDE_STATE_TRANSITIONS.get(from);
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.has(to);
}

/**
 * Returns the set of states that are terminal (no further transitions).
 */
export function getTerminalStates(): RideStatus[] {
  const terminal: RideStatus[] = [];
  for (const [state, transitions] of RIDE_STATE_TRANSITIONS) {
    if (transitions.size === 0) {
      terminal.push(state);
    }
  }
  return terminal;
}

/**
 * Returns the set of states considered "active" (ride is in progress).
 */
export function getActiveRideStates(): RideStatus[] {
  return [
    RideStatus.DRIVER_ASSIGNED,
    RideStatus.DRIVER_EN_ROUTE,
    RideStatus.DRIVER_ARRIVED,
    RideStatus.RIDE_IN_PROGRESS,
  ];
}

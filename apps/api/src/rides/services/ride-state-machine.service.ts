import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RideStatus, isValidRideTransition, getActiveRideStates, getTerminalStates } from '@yatra-seva/shared-types';

@Injectable()
export class RideStateMachineService {
  private readonly logger = new Logger(RideStateMachineService.name);

  /**
   * Check whether a transition between two ride statuses is legal.
   */
  canTransition(currentStatus: string, targetStatus: string): boolean {
    return isValidRideTransition(currentStatus as RideStatus, targetStatus as RideStatus);
  }

  /**
   * Assert that a transition from currentStatus to targetStatus is valid.
   * Throws ConflictException or BadRequestException if invalid.
   */
  assertValidTransition(currentStatus: string, targetStatus: string): void {
    if (currentStatus === targetStatus) {
      // Duplicate transition attempt
      return;
    }

    const valid = this.canTransition(currentStatus, targetStatus);
    if (!valid) {
      this.logger.warn(`Illegal transition attempted: ${currentStatus} -> ${targetStatus}`);
      throw new ConflictException(
        `Invalid ride state transition from ${currentStatus} to ${targetStatus}`,
      );
    }
  }

  /**
   * Check if status is one of the active ride lifecycle states.
   */
  isActive(status: string): boolean {
    return getActiveRideStates().includes(status as RideStatus);
  }

  /**
   * Check if status is a terminal state.
   */
  isTerminal(status: string): boolean {
    return getTerminalStates().includes(status as RideStatus);
  }

  /**
   * Check if a rider is permitted to cancel from the given status.
   * Allowed: REQUESTED, SEARCHING_DRIVER, DRIVER_ASSIGNED, DRIVER_ARRIVING (and DRIVER_EN_ROUTE).
   * Restricted: DRIVER_ARRIVED (throws specific 400 error).
   * Strictly Forbidden: RIDE_STARTED, RIDE_COMPLETED, PAYMENT_PENDING, COMPLETED.
   */
  assertRiderCanCancel(status: string): void {
    if (status === RideStatus.DRIVER_ARRIVED) {
      throw new BadRequestException('Rider cannot cancel after driver has arrived at pickup location');
    }

    const allowed = [
      RideStatus.REQUESTED,
      RideStatus.SEARCHING_DRIVER,
      RideStatus.DRIVER_ASSIGNED,
      RideStatus.DRIVER_ARRIVING,
      RideStatus.DRIVER_EN_ROUTE,
    ];

    if (!allowed.includes(status as RideStatus)) {
      throw new ConflictException(`Rider cannot cancel ride in ${status} status`);
    }
  }

  /**
   * Check if a driver is permitted to cancel the assigned ride.
   * Allowed: DRIVER_ASSIGNED, DRIVER_ARRIVING, DRIVER_ARRIVED (before ride starts).
   * Strictly Forbidden: RIDE_STARTED, RIDE_COMPLETED, PAYMENT_PENDING, COMPLETED.
   */
  assertDriverCanCancel(status: string): void {
    const allowed = [
      RideStatus.DRIVER_ASSIGNED,
      RideStatus.DRIVER_ARRIVING,
      RideStatus.DRIVER_EN_ROUTE,
      RideStatus.DRIVER_ARRIVED,
    ];

    if (!allowed.includes(status as RideStatus)) {
      throw new ConflictException(`Driver cannot cancel ride after ride has started (current status: ${status})`);
    }
  }
}

import { RideStatus } from '../enums/ride-status.enum';
import {
  isValidRideTransition,
  getTerminalStates,
  getActiveRideStates,
  RIDE_STATE_TRANSITIONS,
} from './ride-state-machine';

describe('Ride State Machine', () => {
  describe('isValidRideTransition', () => {
    it('should allow REQUESTED → SEARCHING_DRIVER', () => {
      expect(isValidRideTransition(RideStatus.REQUESTED, RideStatus.SEARCHING_DRIVER)).toBe(true);
    });

    it('should allow REQUESTED → CANCELLED_BY_RIDER', () => {
      expect(isValidRideTransition(RideStatus.REQUESTED, RideStatus.CANCELLED_BY_RIDER)).toBe(
        true,
      );
    });

    it('should NOT allow REQUESTED → RIDE_IN_PROGRESS (skipping states)', () => {
      expect(isValidRideTransition(RideStatus.REQUESTED, RideStatus.RIDE_IN_PROGRESS)).toBe(false);
    });

    it('should NOT allow COMPLETED → any state (terminal)', () => {
      const allStatuses = Object.values(RideStatus);
      for (const status of allStatuses) {
        expect(isValidRideTransition(RideStatus.COMPLETED, status)).toBe(false);
      }
    });

    it('should NOT allow CANCELLED_BY_RIDER → any state (terminal)', () => {
      const allStatuses = Object.values(RideStatus);
      for (const status of allStatuses) {
        expect(isValidRideTransition(RideStatus.CANCELLED_BY_RIDER, status)).toBe(false);
      }
    });

    it('should allow SEARCHING_DRIVER → DRIVER_ASSIGNED', () => {
      expect(
        isValidRideTransition(RideStatus.SEARCHING_DRIVER, RideStatus.DRIVER_ASSIGNED),
      ).toBe(true);
    });

    it('should allow SEARCHING_DRIVER → CANCELLED_NO_DRIVER', () => {
      expect(
        isValidRideTransition(RideStatus.SEARCHING_DRIVER, RideStatus.CANCELLED_NO_DRIVER),
      ).toBe(true);
    });

    it('should allow the full happy path', () => {
      const happyPath: RideStatus[] = [
        RideStatus.REQUESTED,
        RideStatus.SEARCHING_DRIVER,
        RideStatus.DRIVER_ASSIGNED,
        RideStatus.DRIVER_EN_ROUTE,
        RideStatus.DRIVER_ARRIVED,
        RideStatus.RIDE_IN_PROGRESS,
        RideStatus.RIDE_COMPLETED,
        RideStatus.PAYMENT_PENDING,
        RideStatus.COMPLETED,
      ];

      for (let i = 0; i < happyPath.length - 1; i++) {
        expect(isValidRideTransition(happyPath[i]!, happyPath[i + 1]!)).toBe(true);
      }
    });

    it('should allow PAYMENT_PENDING → PAYMENT_FAILED → PAYMENT_PENDING (retry)', () => {
      expect(
        isValidRideTransition(RideStatus.PAYMENT_PENDING, RideStatus.PAYMENT_FAILED),
      ).toBe(true);
      expect(
        isValidRideTransition(RideStatus.PAYMENT_FAILED, RideStatus.PAYMENT_PENDING),
      ).toBe(true);
    });

    it('should allow RIDE_COMPLETED → COMPLETED (cash payment shortcut)', () => {
      expect(isValidRideTransition(RideStatus.RIDE_COMPLETED, RideStatus.COMPLETED)).toBe(true);
    });

    it('should NOT allow reverse transitions', () => {
      expect(
        isValidRideTransition(RideStatus.DRIVER_ARRIVED, RideStatus.DRIVER_EN_ROUTE),
      ).toBe(false);
      expect(
        isValidRideTransition(RideStatus.RIDE_IN_PROGRESS, RideStatus.DRIVER_ARRIVED),
      ).toBe(false);
    });

    it('should allow driver cancellation during active pre-ride states', () => {
      const cancelableByDriver = [
        RideStatus.DRIVER_ASSIGNED,
        RideStatus.DRIVER_EN_ROUTE,
        RideStatus.DRIVER_ARRIVED,
      ];
      for (const state of cancelableByDriver) {
        expect(isValidRideTransition(state, RideStatus.CANCELLED_BY_DRIVER)).toBe(true);
      }
    });

    it('should NOT allow driver cancellation during ride', () => {
      expect(
        isValidRideTransition(RideStatus.RIDE_IN_PROGRESS, RideStatus.CANCELLED_BY_DRIVER),
      ).toBe(false);
    });
  });

  describe('getTerminalStates', () => {
    it('should return exactly 4 terminal states', () => {
      const terminals = getTerminalStates();
      expect(terminals).toHaveLength(4);
      expect(terminals).toContain(RideStatus.COMPLETED);
      expect(terminals).toContain(RideStatus.CANCELLED_BY_RIDER);
      expect(terminals).toContain(RideStatus.CANCELLED_BY_DRIVER);
      expect(terminals).toContain(RideStatus.CANCELLED_NO_DRIVER);
    });
  });

  describe('getActiveRideStates', () => {
    it('should include states where a ride is actively assigned/in-progress', () => {
      const active = getActiveRideStates();
      expect(active).toContain(RideStatus.DRIVER_ASSIGNED);
      expect(active).toContain(RideStatus.DRIVER_EN_ROUTE);
      expect(active).toContain(RideStatus.DRIVER_ARRIVED);
      expect(active).toContain(RideStatus.RIDE_IN_PROGRESS);
    });

    it('should NOT include terminal or search states', () => {
      const active = getActiveRideStates();
      expect(active).not.toContain(RideStatus.REQUESTED);
      expect(active).not.toContain(RideStatus.SEARCHING_DRIVER);
      expect(active).not.toContain(RideStatus.COMPLETED);
      expect(active).not.toContain(RideStatus.CANCELLED_BY_RIDER);
    });
  });

  describe('RIDE_STATE_TRANSITIONS completeness', () => {
    it('should define transitions for every RideStatus', () => {
      const allStatuses = Object.values(RideStatus);
      for (const status of allStatuses) {
        expect(RIDE_STATE_TRANSITIONS.has(status)).toBe(true);
      }
    });

    it('should only reference valid RideStatus values in transition targets', () => {
      const allStatuses = new Set(Object.values(RideStatus));
      for (const [_state, transitions] of RIDE_STATE_TRANSITIONS) {
        for (const target of transitions) {
          expect(allStatuses.has(target)).toBe(true);
        }
      }
    });
  });
});

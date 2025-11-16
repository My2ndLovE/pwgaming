import { TimeoutService } from '../../../src/modules/game/services/timeout.service';

describe('TimeoutService', () => {
  let service: TimeoutService;

  beforeEach(() => {
    service = new TimeoutService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('startActionTimer', () => {
    it('should start a timeout for a specific hand and player', () => {
      const callback = jest.fn();
      const handId = 'hand-123';
      const playerId = 'player-1';
      const timeoutSeconds = 30;

      service.startActionTimer(handId, playerId, timeoutSeconds, callback);

      // Fast-forward time
      jest.advanceTimersByTime(30000);

      expect(callback).toHaveBeenCalledWith(handId, playerId);
    });

    it('should not trigger callback before timeout expires', () => {
      const callback = jest.fn();
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, callback);

      jest.advanceTimersByTime(15000); // 15 seconds

      expect(callback).not.toHaveBeenCalled();
    });

    it('should allow multiple active timers for different players', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const handId = 'hand-123';

      service.startActionTimer(handId, 'player-1', 20, callback1);
      service.startActionTimer(handId, 'player-2', 30, callback2);

      jest.advanceTimersByTime(20000);
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      jest.advanceTimersByTime(10000);
      expect(callback2).toHaveBeenCalled();
    });

    it('should replace existing timer for same hand and player', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, callback1);
      service.startActionTimer(handId, playerId, 10, callback2);

      jest.advanceTimersByTime(10000);

      expect(callback2).toHaveBeenCalled();
      expect(callback1).not.toHaveBeenCalled();

      jest.advanceTimersByTime(20000);
      // First callback should never fire
      expect(callback1).not.toHaveBeenCalled();
    });
  });

  describe('clearActionTimer', () => {
    it('should clear an active timer', () => {
      const callback = jest.fn();
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, callback);
      service.clearActionTimer(handId, playerId);

      jest.advanceTimersByTime(30000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw error when clearing non-existent timer', () => {
      expect(() => {
        service.clearActionTimer('hand-999', 'player-999');
      }).not.toThrow();
    });
  });

  describe('clearAllTimersForHand', () => {
    it('should clear all timers for a specific hand', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();
      const handId = 'hand-123';

      service.startActionTimer(handId, 'player-1', 30, callback1);
      service.startActionTimer(handId, 'player-2', 30, callback2);
      service.startActionTimer('hand-456', 'player-3', 30, callback3);

      service.clearAllTimersForHand(handId);

      jest.advanceTimersByTime(30000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled(); // Different hand
    });

    it('should not throw error when clearing timers for hand with no timers', () => {
      expect(() => {
        service.clearAllTimersForHand('hand-999');
      }).not.toThrow();
    });
  });

  describe('clearAllTimers', () => {
    it('should clear all active timers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      service.startActionTimer('hand-1', 'player-1', 30, callback1);
      service.startActionTimer('hand-2', 'player-2', 30, callback2);
      service.startActionTimer('hand-3', 'player-3', 30, callback3);

      service.clearAllTimers();

      jest.advanceTimersByTime(30000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });
  });

  describe('hasActiveTimer', () => {
    it('should return true when timer is active', () => {
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, jest.fn());

      expect(service.hasActiveTimer(handId, playerId)).toBe(true);
    });

    it('should return false when timer does not exist', () => {
      expect(service.hasActiveTimer('hand-999', 'player-999')).toBe(false);
    });

    it('should return false after timer is cleared', () => {
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, jest.fn());
      service.clearActionTimer(handId, playerId);

      expect(service.hasActiveTimer(handId, playerId)).toBe(false);
    });

    it('should return false after timer expires', () => {
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, jest.fn());

      jest.advanceTimersByTime(30000);

      expect(service.hasActiveTimer(handId, playerId)).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining time in milliseconds', () => {
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, jest.fn());

      jest.advanceTimersByTime(10000);

      const remaining = service.getRemainingTime(handId, playerId);
      expect(remaining).toBeGreaterThanOrEqual(19000);
      expect(remaining).toBeLessThanOrEqual(20000);
    });

    it('should return 0 when timer does not exist', () => {
      const remaining = service.getRemainingTime('hand-999', 'player-999');
      expect(remaining).toBe(0);
    });

    it('should return 0 after timer expires', () => {
      const handId = 'hand-123';
      const playerId = 'player-1';

      service.startActionTimer(handId, playerId, 30, jest.fn());

      jest.advanceTimersByTime(30000);

      const remaining = service.getRemainingTime(handId, playerId);
      expect(remaining).toBe(0);
    });
  });

  describe('getActiveTimersCount', () => {
    it('should return count of active timers', () => {
      service.startActionTimer('hand-1', 'player-1', 30, jest.fn());
      service.startActionTimer('hand-1', 'player-2', 30, jest.fn());
      service.startActionTimer('hand-2', 'player-3', 30, jest.fn());

      expect(service.getActiveTimersCount()).toBe(3);
    });

    it('should return 0 when no timers exist', () => {
      expect(service.getActiveTimersCount()).toBe(0);
    });

    it('should update count when timers are cleared', () => {
      service.startActionTimer('hand-1', 'player-1', 30, jest.fn());
      service.startActionTimer('hand-1', 'player-2', 30, jest.fn());

      expect(service.getActiveTimersCount()).toBe(2);

      service.clearActionTimer('hand-1', 'player-1');

      expect(service.getActiveTimersCount()).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero timeout', () => {
      const callback = jest.fn();
      service.startActionTimer('hand-1', 'player-1', 0, callback);

      jest.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalled();
    });

    it('should handle very long timeout', () => {
      const callback = jest.fn();
      const oneHour = 3600;

      service.startActionTimer('hand-1', 'player-1', oneHour, callback);

      jest.advanceTimersByTime(3600000 - 1000);
      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
    });

    it('should handle rapid timer creation and clearing', () => {
      for (let i = 0; i < 100; i++) {
        service.startActionTimer('hand-1', `player-${i}`, 30, jest.fn());
      }

      expect(service.getActiveTimersCount()).toBe(100);

      service.clearAllTimers();

      expect(service.getActiveTimersCount()).toBe(0);
    });
  });
});

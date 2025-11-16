import { Injectable } from '@nestjs/common';

type TimeoutCallback = (handId: string, playerId: string) => void;

interface TimerInfo {
  handId: string;
  playerId: string;
  timeout: NodeJS.Timeout;
  startTime: number;
  duration: number;
}

@Injectable()
export class TimeoutService {
  private timers: Map<string, TimerInfo> = new Map();

  /**
   * Starts an action timer for a specific player in a hand
   */
  startActionTimer(
    handId: string,
    playerId: string,
    timeoutSeconds: number,
    callback: TimeoutCallback
  ): void {
    const key = this.getTimerKey(handId, playerId);

    // Clear existing timer if present
    if (this.timers.has(key)) {
      this.clearActionTimer(handId, playerId);
    }

    const timeout = setTimeout(() => {
      callback(handId, playerId);
      this.timers.delete(key);
    }, timeoutSeconds * 1000);

    this.timers.set(key, {
      handId,
      playerId,
      timeout,
      startTime: Date.now(),
      duration: timeoutSeconds * 1000,
    });
  }

  /**
   * Clears a specific action timer
   */
  clearActionTimer(handId: string, playerId: string): void {
    const key = this.getTimerKey(handId, playerId);
    const timerInfo = this.timers.get(key);

    if (timerInfo) {
      clearTimeout(timerInfo.timeout);
      this.timers.delete(key);
    }
  }

  /**
   * Clears all timers for a specific hand
   */
  clearAllTimersForHand(handId: string): void {
    const keysToDelete: string[] = [];

    this.timers.forEach((timerInfo, key) => {
      if (timerInfo.handId === handId) {
        clearTimeout(timerInfo.timeout);
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.timers.delete(key));
  }

  /**
   * Clears all active timers
   */
  clearAllTimers(): void {
    this.timers.forEach(timerInfo => {
      clearTimeout(timerInfo.timeout);
    });

    this.timers.clear();
  }

  /**
   * Checks if a timer is active for a specific player
   */
  hasActiveTimer(handId: string, playerId: string): boolean {
    const key = this.getTimerKey(handId, playerId);
    return this.timers.has(key);
  }

  /**
   * Gets remaining time in milliseconds for a specific timer
   */
  getRemainingTime(handId: string, playerId: string): number {
    const key = this.getTimerKey(handId, playerId);
    const timerInfo = this.timers.get(key);

    if (!timerInfo) {
      return 0;
    }

    const elapsed = Date.now() - timerInfo.startTime;
    const remaining = timerInfo.duration - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * Gets count of all active timers
   */
  getActiveTimersCount(): number {
    return this.timers.size;
  }

  /**
   * Generates a unique key for a hand-player combination
   */
  private getTimerKey(handId: string, playerId: string): string {
    return `${handId}:${playerId}`;
  }
}

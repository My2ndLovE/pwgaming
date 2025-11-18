import { Injectable } from '@nestjs/common';

interface PlayerActionTiming {
  userId: string;
  actionTimes: number[]; // Milliseconds from prompt to action
  totalActions: number;
  averageResponseTime: number;
  lastActionAt: Date;
}

/**
 * BotDetectionService tracks player behavior to detect automated play
 * Flags suspicious patterns for admin review
 */
@Injectable()
export class BotDetectionService {
  private playerTimings: Map<string, PlayerActionTiming> = new Map();
  private readonly SUSPICIOUS_AVG_MS = 500; // Flag if avg < 500ms
  private readonly MIN_ACTIONS_FOR_DETECTION = 10; // Need 10+ actions for accurate avg

  /**
   * Record action timing for a player
   * @param userId Player ID
   * @param responseTimeMs Time from action prompt to action submission
   */
  recordAction(userId: string, responseTimeMs: number): void {
    if (!this.playerTimings.has(userId)) {
      this.playerTimings.set(userId, {
        userId,
        actionTimes: [],
        totalActions: 0,
        averageResponseTime: 0,
        lastActionAt: new Date(),
      });
    }

    const timing = this.playerTimings.get(userId)!;
    timing.actionTimes.push(responseTimeMs);
    timing.totalActions++;
    timing.lastActionAt = new Date();

    // Keep only last 50 actions for rolling average
    if (timing.actionTimes.length > 50) {
      timing.actionTimes.shift();
    }

    // Calculate average
    timing.averageResponseTime =
      timing.actionTimes.reduce((sum, time) => sum + time, 0) /
      timing.actionTimes.length;
  }

  /**
   * Check if player exhibits bot-like behavior
   * Returns true if suspicious
   */
  isSuspicious(userId: string): boolean {
    const timing = this.playerTimings.get(userId);
    if (!timing) return false;

    // Need minimum actions for accurate detection
    if (timing.totalActions < this.MIN_ACTIONS_FOR_DETECTION) {
      return false;
    }

    // Flag if average response time is suspiciously fast
    return timing.averageResponseTime < this.SUSPICIOUS_AVG_MS;
  }

  /**
   * Get detection report for a player
   */
  getReport(userId: string): PlayerActionTiming | null {
    return this.playerTimings.get(userId) || null;
  }

  /**
   * Get all suspicious players
   */
  getSuspiciousPlayers(): PlayerActionTiming[] {
    const suspicious: PlayerActionTiming[] = [];

    this.playerTimings.forEach((timing) => {
      if (this.isSuspicious(timing.userId)) {
        suspicious.push(timing);
      }
    });

    return suspicious;
  }

  /**
   * Clear timing data for a player
   */
  clearPlayer(userId: string): void {
    this.playerTimings.delete(userId);
  }

  /**
   * Cleanup stale data (players inactive for 24h)
   */
  cleanupStaleData(): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    let cleaned = 0;

    this.playerTimings.forEach((timing, userId) => {
      if (timing.lastActionAt.getTime() < cutoff) {
        this.playerTimings.delete(userId);
        cleaned++;
      }
    });

    return cleaned;
  }
}

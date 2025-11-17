import { Injectable } from '@nestjs/common';

interface IPTracking {
  ip: string;
  userIds: Set<string>;
  roomIds: Set<string>;
  firstSeen: Date;
  lastSeen: Date;
  flagged: boolean;
  flagReason?: string;
}

interface RoomPlayers {
  roomId: string;
  players: Map<string, string>; // userId -> IP
}

/**
 * MultiAccountDetectionService tracks IP addresses to detect:
 * - Multiple accounts from same IP in same game
 * - Suspicious IP patterns
 */
@Injectable()
export class MultiAccountDetectionService {
  private ipTracking: Map<string, IPTracking> = new Map();
  private roomPlayers: Map<string, RoomPlayers> = new Map();

  /**
   * Track player joining a room
   * @returns true if flagged as suspicious
   */
  trackPlayerJoin(userId: string, roomId: string, ip: string): boolean {
    // Track IP
    if (!this.ipTracking.has(ip)) {
      this.ipTracking.set(ip, {
        ip,
        userIds: new Set(),
        roomIds: new Set(),
        firstSeen: new Date(),
        lastSeen: new Date(),
        flagged: false,
      });
    }

    const tracking = this.ipTracking.get(ip)!;
    tracking.userIds.add(userId);
    tracking.roomIds.add(roomId);
    tracking.lastSeen = new Date();

    // Track room players
    if (!this.roomPlayers.has(roomId)) {
      this.roomPlayers.set(roomId, {
        roomId,
        players: new Map(),
      });
    }

    const room = this.roomPlayers.get(roomId)!;
    room.players.set(userId, ip);

    // Check if same IP already in this room (different user)
    const sameIPUsers: string[] = [];
    room.players.forEach((playerIP, playerUserId) => {
      if (playerIP === ip && playerUserId !== userId) {
        sameIPUsers.push(playerUserId);
      }
    });

    // Flag if same IP in same room
    if (sameIPUsers.length > 0) {
      tracking.flagged = true;
      tracking.flagReason = `Multiple accounts in same room: ${sameIPUsers.join(', ')}`;
      return true;
    }

    return false;
  }

  /**
   * Track player leaving a room
   */
  trackPlayerLeave(userId: string, roomId: string): void {
    const room = this.roomPlayers.get(roomId);
    if (room) {
      room.players.delete(userId);

      // Cleanup empty rooms
      if (room.players.size === 0) {
        this.roomPlayers.delete(roomId);
      }
    }
  }

  /**
   * Check if IP is flagged
   */
  isFlagged(ip: string): boolean {
    const tracking = this.ipTracking.get(ip);
    return tracking?.flagged || false;
  }

  /**
   * Get tracking info for an IP
   */
  getIPInfo(ip: string): IPTracking | null {
    return this.ipTracking.get(ip) || null;
  }

  /**
   * Get all flagged IPs
   */
  getFlaggedIPs(): IPTracking[] {
    const flagged: IPTracking[] = [];

    this.ipTracking.forEach((tracking) => {
      if (tracking.flagged) {
        flagged.push(tracking);
      }
    });

    return flagged;
  }

  /**
   * Get players in a room
   */
  getRoomPlayers(roomId: string): Map<string, string> | null {
    const room = this.roomPlayers.get(roomId);
    return room?.players || null;
  }

  /**
   * Manually flag an IP
   */
  flagIP(ip: string, reason: string): void {
    const tracking = this.ipTracking.get(ip);
    if (tracking) {
      tracking.flagged = true;
      tracking.flagReason = reason;
    }
  }

  /**
   * Unflag an IP (admin action)
   */
  unflagIP(ip: string): void {
    const tracking = this.ipTracking.get(ip);
    if (tracking) {
      tracking.flagged = false;
      tracking.flagReason = undefined;
    }
  }

  /**
   * Cleanup stale IP data (inactive for 7 days)
   */
  cleanupStaleData(): number {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    let cleaned = 0;

    this.ipTracking.forEach((tracking, ip) => {
      if (tracking.lastSeen.getTime() < cutoff) {
        this.ipTracking.delete(ip);
        cleaned++;
      }
    });

    return cleaned;
  }
}

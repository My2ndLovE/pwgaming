/**
 * Test data factories for creating mock objects
 */

import { User } from '../../src/modules/user/entities/user.entity';
import { Room } from '../../src/modules/room/entities/room.entity';

export class TestFactories {
  /**
   * Create a mock user
   */
  static createUser(overrides?: Partial<User>): User {
    const user = new User();
    user.id = overrides?.id || 'test-user-123';
    user.telegramId = overrides?.telegramId || '123456789';
    user.username = overrides?.username || 'testuser';
    user.firstName = overrides?.firstName || 'Test';
    user.lastName = overrides?.lastName || 'User';
    user.balance = overrides?.balance ?? 1000;
    user.createdAt = overrides?.createdAt || new Date();
    user.updatedAt = overrides?.updatedAt || new Date();
    return user;
  }

  /**
   * Create a mock room
   */
  static createRoom(overrides?: Partial<Room>): Room {
    const room = new Room();
    room.id = overrides?.id || 'test-room-123';
    room.name = overrides?.name || 'Test Room';
    room.smallBlind = overrides?.smallBlind ?? 1;
    room.bigBlind = overrides?.bigBlind ?? 2;
    room.minBuyIn = overrides?.minBuyIn ?? 40;
    room.maxBuyIn = overrides?.maxBuyIn ?? 200;
    room.maxPlayers = overrides?.maxPlayers ?? 9;
    room.currentPlayers = overrides?.currentPlayers ?? 0;
    room.status = overrides?.status || 'active';
    room.createdAt = overrides?.createdAt || new Date();
    room.updatedAt = overrides?.updatedAt || new Date();
    return room;
  }

  /**
   * Create an array of test cards
   */
  static createCards(cards?: string[]): string[] {
    return cards || ['Ah', 'Kd', 'Qh', 'Js', 'Ts'];
  }

  /**
   * Create a complete deck of cards
   */
  static createDeck(): string[] {
    const suits = ['h', 'd', 'c', 's'];
    const ranks = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'T',
      'J',
      'Q',
      'K',
      'A',
    ];
    const deck: string[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(`${rank}${suit}`);
      }
    }

    return deck;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Create a mock game state
   */
  static createGameState(overrides?: any): any {
    return {
      roomId: overrides?.roomId || 'test-room-123',
      handNumber: overrides?.handNumber ?? 1,
      dealerPosition: overrides?.dealerPosition ?? 0,
      currentTurn: overrides?.currentTurn ?? 0,
      pot: overrides?.pot ?? 0,
      communityCards: overrides?.communityCards || [],
      phase: overrides?.phase || 'preflop',
      players: overrides?.players || [],
      ...overrides,
    };
  }
}

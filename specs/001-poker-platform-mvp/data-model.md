# Data Model Specification: Texas Poker Platform MVP

**Feature Branch**: `001-poker-platform-mvp`
**Created**: 2025-01-15
**Status**: Draft
**Database**: PostgreSQL 14+
**ORM**: TypeORM 0.3.x
**Validation**: class-validator

## Overview

This document defines the complete data model for the Texas Poker Platform MVP, including entity definitions with TypeORM decorators, validation rules, relationships, indexes, and state management. All entities use PostgreSQL-specific features (UUID, JSONB, INET) for optimal performance and data integrity.

## Table of Contents

1. [Core Entities](#core-entities)
2. [Entity Definitions](#entity-definitions)
3. [Relationships & Cardinality](#relationships--cardinality)
4. [State Transition Diagrams](#state-transition-diagrams)
5. [Database Indexes](#database-indexes)
6. [Migration Considerations](#migration-considerations)

---

## Core Entities

### Entity Summary

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| User | Player and admin accounts | hasMany: Transaction, GamePlayer, Room (as creator) |
| Room | Poker game rooms | belongsTo: User (creator), hasMany: GameHand |
| GameHand | Individual poker hands | belongsTo: Room, hasMany: PlayerSeat, BettingAction |
| Transaction | Financial operations | belongsTo: User, belongsTo: User (processedBy) |
| PlayerSeat | Player position at table | belongsTo: GameHand, belongsTo: User |
| BettingAction | Player game actions | belongsTo: GameHand, belongsTo: User |
| AuditLog | System audit trail | belongsTo: User |
| PlatformSettings | Global configuration | Singleton entity |

---

## Entity Definitions

### 1. User Entity

**Purpose**: Represents player and admin accounts with authentication, balance management, and account status.

**Mapped Requirements**: FR-001 to FR-005, FR-063 to FR-069

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsEnum,
  IsDecimal,
  Min,
  Max,
  Length,
} from 'class-validator';

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

@Entity('users')
@Index('idx_user_telegram_id', ['telegramId'], { unique: true })
@Index('idx_user_username', ['username'])
@Index('idx_user_status', ['status'])
@Index('idx_user_created_at', ['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, nullable: false })
  @IsNotEmpty()
  telegramId: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  username: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsUrl()
  avatarUrl: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  balance: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  suspensionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => PlayerSeat, (playerSeat) => playerSeat.user)
  playerSeats: PlayerSeat[];

  @OneToMany(() => Room, (room) => room.creator)
  createdRooms: Room[];

  @OneToMany(() => Transaction, (transaction) => transaction.processedBy)
  processedTransactions: Transaction[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  @OneToMany(() => BettingAction, (action) => action.player)
  bettingActions: BettingAction[];

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateBalance() {
    if (this.balance < 0) {
      throw new Error('Balance cannot be negative');
    }
  }

  @BeforeUpdate()
  validateStatusTransition() {
    // Validate status transitions (see state diagram)
    const validTransitions = {
      [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.BANNED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.BANNED],
      [UserStatus.BANNED]: [], // No transitions allowed from banned
    };

    // Additional validation logic would be implemented in service layer
  }
}
```

**Validation Rules**:
- `telegramId`: Required, unique, bigint
- `username`: Required, 1-255 characters
- `balance`: Must be >= 0, decimal(15,2)
- `role`: Must be valid UserRole enum
- `status`: Must be valid UserStatus enum
- `suspensionReason`: Optional, max 1000 characters

**Indexes**:
- Primary key: `id` (UUID)
- Unique index: `telegramId`
- Index: `username` (for search)
- Index: `status` (for filtering)
- Index: `createdAt` (for sorting)

---

### 2. Room Entity

**Purpose**: Represents poker game rooms with configurable stakes and player limits.

**Mapped Requirements**: FR-016 to FR-024, FR-070 to FR-075

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsDecimal,
  Min,
  Max,
  IsEnum,
  IsInt,
  Length,
} from 'class-validator';

export enum RoomStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
}

@Entity('rooms')
@Index('idx_room_status', ['status'])
@Index('idx_room_created_at', ['createdAt'])
@Index('idx_room_created_by', ['createdBy'])
@Index('idx_room_status_created', ['status', 'createdAt'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  smallBlind: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.02)
  bigBlind: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  minBuyIn: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  maxBuyIn: number;

  @Column({ type: 'int', default: 9 })
  @IsInt()
  @Min(2)
  @Max(9)
  maxPlayers: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  @Max(9)
  currentPlayers: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  @IsEnum(RoomStatus)
  status: RoomStatus;

  @Column({ type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  suspensionReason: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.createdRooms)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => GameHand, (gameHand) => gameHand.room)
  gameHands: GameHand[];

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateBlindsAndBuyIns() {
    if (this.bigBlind < this.smallBlind) {
      throw new Error('Big blind must be greater than or equal to small blind');
    }
    if (this.maxBuyIn < this.minBuyIn) {
      throw new Error('Maximum buy-in must be greater than or equal to minimum buy-in');
    }
    if (this.currentPlayers > this.maxPlayers) {
      throw new Error('Current players cannot exceed maximum players');
    }
  }
}
```

**Validation Rules**:
- `name`: Required, 1-255 characters
- `smallBlind`: Required, > 0, decimal(15,2)
- `bigBlind`: Required, >= smallBlind, decimal(15,2)
- `minBuyIn`: Required, > 0, decimal(15,2)
- `maxBuyIn`: Required, >= minBuyIn, decimal(15,2)
- `maxPlayers`: 2-9 inclusive
- `currentPlayers`: 0 to maxPlayers, updated automatically
- `status`: Must be valid RoomStatus enum

**Indexes**:
- Primary key: `id` (UUID)
- Index: `status` (for filtering)
- Index: `createdAt DESC` (for sorting)
- Composite index: `status + createdAt` (for filtered sorting)
- Index: `createdBy` (for user's rooms)

---

### 3. GameHand Entity

**Purpose**: Represents a single poker hand with complete game state, actions, and results.

**Mapped Requirements**: FR-025 to FR-041, FR-092 to FR-097

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import {
  IsNotEmpty,
  IsInt,
  IsDecimal,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum HandPhase {
  PREFLOP = 'preflop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river',
  SHOWDOWN = 'showdown',
  COMPLETED = 'completed',
}

@Entity('game_hands')
@Index('idx_game_hand_room_id', ['roomId'])
@Index('idx_game_hand_started_at', ['startedAt'])
@Index('idx_game_hand_room_started', ['roomId', 'startedAt'])
@Index('idx_game_hand_players', ['players'], {
  synchronize: false, // GIN index created manually in migration
})
export class GameHand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  roomId: string;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(1)
  handNumber: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  smallBlind: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  bigBlind: number;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(0)
  @Max(8)
  dealerPosition: number;

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  communityCards: string[] | null; // Array of card strings: ['Ah', 'Kd', '5c', '9s', '2h']

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  potAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  winners: WinnerInfo[] | null; // Array of winner objects with userId, amount, hand

  @Column({ type: 'jsonb', nullable: false })
  @IsArray()
  players: PlayerInfo[]; // Array of player objects with userId, position, chipStack

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  actions: ActionSummary[] | null; // Lightweight summary of actions for quick retrieval

  @Column({
    type: 'enum',
    enum: HandPhase,
    default: HandPhase.PREFLOP,
  })
  @IsEnum(HandPhase)
  currentPhase: HandPhase;

  @Column({ type: 'timestamp', nullable: false })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  @IsInt()
  @Min(0)
  durationSeconds: number | null;

  // Relationships
  @ManyToOne(() => Room, (room) => room.gameHands)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @OneToMany(() => PlayerSeat, (playerSeat) => playerSeat.gameHand)
  playerSeats: PlayerSeat[];

  @OneToMany(() => BettingAction, (action) => action.gameHand)
  bettingActions: BettingAction[];

  // Lifecycle hooks
  @BeforeInsert()
  validateGameHand() {
    if (this.dealerPosition < 0 || this.dealerPosition > 8) {
      throw new Error('Dealer position must be between 0 and 8');
    }
    if (this.handNumber < 1) {
      throw new Error('Hand number must be positive');
    }
  }
}

// Supporting interfaces for JSONB columns
export interface WinnerInfo {
  userId: string;
  amount: number;
  handRank: string; // e.g., 'Royal Flush', 'Full House'
  handCards: string[]; // Best 5 cards used
}

export interface PlayerInfo {
  userId: string;
  position: number;
  chipStack: number;
  isActive: boolean;
}

export interface ActionSummary {
  playerId: string;
  action: string;
  amount: number;
  phase: string;
  timestamp: Date;
}
```

**Validation Rules**:
- `roomId`: Required, valid UUID
- `handNumber`: Required, > 0
- `dealerPosition`: 0-8 inclusive
- `smallBlind`: Required, >= 0, decimal(15,2)
- `bigBlind`: Required, >= 0, decimal(15,2)
- `potAmount`: >= 0, decimal(15,2)
- `communityCards`: Array of 0-5 card strings
- `players`: Required, array of PlayerInfo objects

**Indexes**:
- Primary key: `id` (UUID)
- Index: `roomId` (for room's hands)
- Index: `startedAt DESC` (for sorting)
- Composite index: `roomId + startedAt` (for room hand history)
- GIN index: `players` JSONB (for player lookup)

**JSONB Columns**:
- `communityCards`: Array of card strings
- `winners`: Array of WinnerInfo objects
- `players`: Array of PlayerInfo objects (for fast queries)
- `actions`: Denormalized action summary (optimization)

---

### 4. Transaction Entity

**Purpose**: Records all financial operations with immutable audit trail.

**Mapped Requirements**: FR-006 to FR-015, FR-055 to FR-062, FR-092

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeUpdate,
} from 'typeorm';
import {
  IsNotEmpty,
  IsDecimal,
  IsEnum,
  Min,
  IsUUID,
  Length,
} from 'class-validator';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  GAME_WIN = 'game_win',
  GAME_LOSS = 'game_loss',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

@Entity('transactions')
@Index('idx_transaction_user_id', ['userId'])
@Index('idx_transaction_type_status', ['type', 'status'])
@Index('idx_transaction_created_at', ['createdAt'])
@Index('idx_transaction_user_created', ['userId', 'createdAt'])
@Index('idx_transaction_reference_id', ['referenceId'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  balanceAfter: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Length(0, 255)
  referenceId: string | null; // External payment gateway reference

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  processedBy: string | null; // Admin who processed this transaction

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'boolean', default: false })
  isImmutable: boolean; // Set to true when status is completed/rejected

  // Relationships
  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, (user) => user.processedTransactions)
  @JoinColumn({ name: 'processedBy' })
  processor: User | null;

  // Lifecycle hooks
  @BeforeUpdate()
  validateImmutability() {
    if (this.isImmutable) {
      throw new Error('Cannot modify completed or rejected transaction');
    }
  }

  @BeforeUpdate()
  validateBalanceReconciliation() {
    const expectedBalance = this.calculateExpectedBalance();
    if (Math.abs(this.balanceAfter - expectedBalance) > 0.001) {
      throw new Error('Balance reconciliation failed');
    }
  }

  private calculateExpectedBalance(): number {
    switch (this.type) {
      case TransactionType.DEPOSIT:
      case TransactionType.GAME_WIN:
      case TransactionType.ADMIN_ADJUSTMENT:
        return this.balanceBefore + this.amount;
      case TransactionType.WITHDRAWAL:
      case TransactionType.GAME_LOSS:
        return this.balanceBefore - this.amount;
      default:
        throw new Error('Invalid transaction type');
    }
  }
}
```

**Validation Rules**:
- `userId`: Required, valid UUID
- `type`: Required, valid TransactionType enum
- `amount`: Required, > 0, decimal(15,2)
- `balanceBefore`: Required, >= 0, decimal(15,2)
- `balanceAfter`: Required, >= 0, decimal(15,2), must reconcile with balanceBefore + amount
- `status`: Must be valid TransactionStatus enum
- `isImmutable`: Set to true when status is completed/rejected (prevents updates)

**Indexes**:
- Primary key: `id` (UUID)
- Index: `userId` (for user transaction history)
- Composite index: `type + status` (for filtering pending withdrawals)
- Index: `createdAt DESC` (for sorting)
- Composite index: `userId + createdAt` (for user transaction history pagination)
- Index: `referenceId` (for payment gateway correlation)

**Immutability**:
- Transactions with status `completed` or `rejected` are marked as immutable
- `@BeforeUpdate()` hook prevents modifications to immutable transactions
- Balance reconciliation validated on every update

---

### 5. PlayerSeat Entity

**Purpose**: Represents a player's position and state at a poker table during a hand.

**Mapped Requirements**: FR-025 to FR-041

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import {
  IsNotEmpty,
  IsInt,
  IsDecimal,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export enum SeatStatus {
  ACTIVE = 'active',
  FOLDED = 'folded',
  ALL_IN = 'all_in',
  DISCONNECTED = 'disconnected',
  SITTING_OUT = 'sitting_out',
}

@Entity('player_seats')
@Index('idx_player_seat_game_hand_id', ['gameHandId'])
@Index('idx_player_seat_user_id', ['userId'])
@Index('idx_player_seat_game_position', ['gameHandId', 'position'], { unique: true })
export class PlayerSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  gameHandId: string;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(0)
  @Max(8)
  position: number;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  chipStack: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  currentBet: number;

  @Column({ type: 'bytea', nullable: true })
  holeCardsEncrypted: Buffer | null; // Encrypted hole cards (2 cards)

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.ACTIVE,
  })
  @IsEnum(SeatStatus)
  status: SeatStatus;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  hasActed: boolean; // Whether player has acted in current betting round

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  timeoutCount: number; // Track consecutive timeouts

  @Column({ type: 'timestamp', nullable: true })
  lastActionAt: Date | null;

  // Relationships
  @ManyToOne(() => GameHand, (gameHand) => gameHand.playerSeats)
  @JoinColumn({ name: 'gameHandId' })
  gameHand: GameHand;

  @ManyToOne(() => User, (user) => user.playerSeats)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateSeat() {
    if (this.position < 0 || this.position > 8) {
      throw new Error('Position must be between 0 and 8');
    }
    if (this.chipStack < 0) {
      throw new Error('Chip stack cannot be negative');
    }
    if (this.currentBet < 0) {
      throw new Error('Current bet cannot be negative');
    }
  }
}
```

**Validation Rules**:
- `gameHandId`: Required, valid UUID
- `position`: 0-8 inclusive
- `userId`: Required, valid UUID
- `chipStack`: >= 0, decimal(15,2)
- `currentBet`: >= 0, decimal(15,2)
- `status`: Must be valid SeatStatus enum
- `hasActed`: Boolean flag for betting round tracking
- `timeoutCount`: Tracks consecutive timeouts (3 = auto-remove)

**Indexes**:
- Primary key: `id` (UUID)
- Index: `gameHandId` (for hand's players)
- Index: `userId` (for player's seats)
- Unique composite index: `gameHandId + position` (ensure one player per position)

**Security**:
- `holeCardsEncrypted`: Stored as encrypted bytea (AES-256)
- Decryption only at showdown or for card owner
- Never transmitted in plain text to clients

---

### 6. BettingAction Entity

**Purpose**: Records individual player actions during a hand for audit and history.

**Mapped Requirements**: FR-031, FR-089, FR-094

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import {
  IsNotEmpty,
  IsDecimal,
  IsEnum,
  Min,
  IsUUID,
} from 'class-validator';

export enum BettingActionType {
  FOLD = 'fold',
  CHECK = 'check',
  CALL = 'call',
  BET = 'bet',
  RAISE = 'raise',
  ALL_IN = 'all_in',
  POST_SMALL_BLIND = 'post_small_blind',
  POST_BIG_BLIND = 'post_big_blind',
}

@Entity('betting_actions')
@Index('idx_betting_action_game_hand_id', ['gameHandId'])
@Index('idx_betting_action_player_id', ['playerId'])
@Index('idx_betting_action_game_timestamp', ['gameHandId', 'timestamp'])
export class BettingAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  gameHandId: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  playerId: string;

  @Column({
    type: 'enum',
    enum: BettingActionType,
    nullable: false,
  })
  @IsEnum(BettingActionType)
  action: BettingActionType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  stackAfter: number;

  @Column({
    type: 'enum',
    enum: HandPhase,
    nullable: false,
  })
  @IsEnum(HandPhase)
  phase: HandPhase;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'int', nullable: true })
  actionTimeMs: number | null; // Time taken to make decision (milliseconds)

  // Relationships
  @ManyToOne(() => GameHand, (gameHand) => gameHand.bettingActions)
  @JoinColumn({ name: 'gameHandId' })
  gameHand: GameHand;

  @ManyToOne(() => User, (user) => user.bettingActions)
  @JoinColumn({ name: 'playerId' })
  player: User;
}
```

**Validation Rules**:
- `gameHandId`: Required, valid UUID
- `playerId`: Required, valid UUID
- `action`: Required, valid BettingActionType enum
- `amount`: >= 0, decimal(15,2) (0 for fold/check)
- `stackAfter`: >= 0, decimal(15,2)
- `phase`: Required, valid HandPhase enum
- `actionTimeMs`: Optional, tracking for bot detection

**Indexes**:
- Primary key: `id` (UUID)
- Index: `gameHandId` (for hand's actions)
- Index: `playerId` (for player action history)
- Composite index: `gameHandId + timestamp` (for action sequence)

**Immutability**:
- Actions are never updated or deleted (audit trail)
- Insert-only entity
- Used for dispute resolution and anti-cheating analysis

---

### 7. AuditLog Entity

**Purpose**: Comprehensive audit trail for admin actions and system events.

**Mapped Requirements**: FR-062, FR-069, FR-075, FR-092, FR-093

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsUUID,
  IsIP,
  Length,
} from 'class-validator';

export enum EventType {
  USER_SUSPENDED = 'user_suspended',
  USER_BANNED = 'user_banned',
  USER_REACTIVATED = 'user_reactivated',
  WITHDRAWAL_APPROVED = 'withdrawal_approved',
  WITHDRAWAL_REJECTED = 'withdrawal_rejected',
  DEPOSIT_APPROVED = 'deposit_approved',
  DEPOSIT_REJECTED = 'deposit_rejected',
  ROOM_SUSPENDED = 'room_suspended',
  ROOM_CLOSED = 'room_closed',
  SETTINGS_UPDATED = 'settings_updated',
  ADMIN_LOGIN = 'admin_login',
  BALANCE_ADJUSTMENT = 'balance_adjustment',
}

export enum EntityType {
  USER = 'user',
  ROOM = 'room',
  TRANSACTION = 'transaction',
  GAME = 'game',
  SETTINGS = 'settings',
}

@Entity('audit_logs')
@Index('idx_audit_log_entity', ['entityType', 'entityId'])
@Index('idx_audit_log_user_id', ['userId'])
@Index('idx_audit_log_created_at', ['createdAt'])
@Index('idx_audit_log_event_type', ['eventType'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: EventType,
    nullable: false,
  })
  @IsEnum(EventType)
  @IsNotEmpty()
  eventType: EventType;

  @Column({
    type: 'enum',
    enum: EntityType,
    nullable: false,
  })
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  entityId: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  userId: string | null; // Admin who performed action (null for system events)

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any> | null; // Before/after values

  @Column({ type: 'inet', nullable: true })
  @IsIP()
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Length(0, 500)
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Length(0, 100)
  serverNode: string | null; // For multi-server deployments

  // Relationships
  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user: User | null;
}
```

**Validation Rules**:
- `eventType`: Required, valid EventType enum
- `entityType`: Required, valid EntityType enum
- `entityId`: Required, valid UUID
- `action`: Required, 1-255 characters description
- `userId`: Optional (null for system events)
- `ipAddress`: Valid IPv4 or IPv6 address
- `userAgent`: Optional, max 500 characters

**Indexes**:
- Primary key: `id` (UUID)
- Composite index: `entityType + entityId` (find all logs for entity)
- Index: `userId` (find all admin actions)
- Index: `createdAt DESC` (chronological sorting)
- Index: `eventType` (filter by event type)

**JSONB Column**:
- `changes`: Stores before/after snapshots
  ```json
  {
    "before": { "status": "active", "balance": 100 },
    "after": { "status": "suspended", "balance": 100 },
    "reason": "Policy violation"
  }
  ```

**Immutability**:
- Audit logs are never updated or deleted
- Insert-only entity
- Retention policy configured separately (e.g., 7 years)

---

### 8. PlatformSettings Entity

**Purpose**: Global platform configuration managed by admins.

**Mapped Requirements**: FR-076 to FR-083

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  BeforeUpdate,
} from 'typeorm';
import {
  IsDecimal,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsString,
  Length,
} from 'class-validator';

@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Singleton: Only one row exists

  // Game Settings
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.5 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  defaultSmallBlind: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 1.0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.02)
  defaultBigBlind: number;

  @Column({ type: 'int', default: 9 })
  @IsInt()
  @Min(2)
  @Max(9)
  maxRoomSize: number;

  @Column({ type: 'int', default: 30 })
  @IsInt()
  @Min(10)
  @Max(120)
  actionTimerSeconds: number;

  @Column({ type: 'int', default: 60 })
  @IsInt()
  @Min(30)
  @Max(300)
  disconnectTimeoutSeconds: number;

  // Financial Settings
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  minDepositAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10000 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  maxDepositAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  minWithdrawalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 5000 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  maxWithdrawalAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  @Max(100)
  withdrawalFeePercent: number;

  // Platform Status
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  maintenanceMode: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Length(0, 500)
  maintenanceMessage: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Length(0, 500)
  announcementBanner: string | null;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowRoomCreation: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowDeposits: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowWithdrawals: boolean;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null; // Admin who last updated settings

  // Lifecycle hooks
  @BeforeUpdate()
  validateSettings() {
    if (this.defaultBigBlind < this.defaultSmallBlind) {
      throw new Error('Default big blind must be >= default small blind');
    }
    if (this.maxDepositAmount < this.minDepositAmount) {
      throw new Error('Max deposit must be >= min deposit');
    }
    if (this.maxWithdrawalAmount < this.minWithdrawalAmount) {
      throw new Error('Max withdrawal must be >= min withdrawal');
    }
  }
}
```

**Validation Rules**:
- `defaultSmallBlind`: > 0, decimal(15,2)
- `defaultBigBlind`: >= defaultSmallBlind, decimal(15,2)
- `maxRoomSize`: 2-9 inclusive
- `actionTimerSeconds`: 10-120 seconds
- `disconnectTimeoutSeconds`: 30-300 seconds
- `minDepositAmount`: > 0, decimal(15,2)
- `maxDepositAmount`: >= minDepositAmount, decimal(15,2)
- `withdrawalFeePercent`: 0-100, decimal(5,2)

**Singleton Pattern**:
- Only one row exists in the database
- Application bootstraps with default settings on first run
- Updates modify the single existing row

---

## Relationships & Cardinality

### Entity Relationship Diagram (ERD) Summary

```
User (1) ----< (M) Transaction
User (1) ----< (M) PlayerSeat
User (1) ----< (M) Room [as creator]
User (1) ----< (M) Transaction [as processor]
User (1) ----< (M) AuditLog
User (1) ----< (M) BettingAction

Room (1) ----< (M) GameHand

GameHand (1) ----< (M) PlayerSeat
GameHand (1) ----< (M) BettingAction
```

### Relationship Details

| Parent | Relationship | Child | Cascade | On Delete |
|--------|--------------|-------|---------|-----------|
| User | One-to-Many | Transaction | No | RESTRICT |
| User | One-to-Many | PlayerSeat | No | RESTRICT |
| User | One-to-Many | Room | No | SET NULL |
| User | One-to-Many | AuditLog | No | SET NULL |
| User | One-to-Many | BettingAction | No | RESTRICT |
| Room | One-to-Many | GameHand | Yes | CASCADE |
| GameHand | One-to-Many | PlayerSeat | Yes | CASCADE |
| GameHand | One-to-Many | BettingAction | Yes | CASCADE |

### Cascade Behaviors

**User Entity**:
- **Transactions**: No cascade (preserve financial history)
- **PlayerSeats**: No cascade (preserve game history)
- **CreatedRooms**: Set NULL on delete (room persists without creator)
- **AuditLogs**: Set NULL on delete (preserve audit trail)

**Room Entity**:
- **GameHands**: CASCADE delete (delete all hands when room deleted)

**GameHand Entity**:
- **PlayerSeats**: CASCADE delete (remove seats with hand)
- **BettingActions**: CASCADE delete (remove actions with hand)

---

## State Transition Diagrams

### User Status State Machine

```
                    ┌─────────┐
                    │         │
           ┌────────► ACTIVE  ◄────────┐
           │        │         │        │
           │        └────┬────┘        │
           │             │             │
           │             │ suspend     │
           │             ▼             │
           │        ┌──────────┐       │
           │   ┌────►          ├───────┘
         reactivate │ SUSPENDED│  reactivate
           │   │    │          │
           │   │    └────┬─────┘
           │   │         │
           │   │         │ ban
           │   │         ▼
           │   │    ┌────────┐
           │   │    │        │
           └───┴────┤ BANNED │ (terminal state)
                    │        │
                    └────────┘
```

**Valid Transitions**:
- `ACTIVE` → `SUSPENDED` (admin action)
- `ACTIVE` → `BANNED` (admin action)
- `SUSPENDED` → `ACTIVE` (admin reactivation)
- `SUSPENDED` → `BANNED` (admin escalation)
- `BANNED` → (no transitions - permanent)

**Transition Triggers**:
- Admin suspension: Manual admin action with reason
- Admin ban: Manual admin action (severe violation)
- Reactivation: Admin review and approval

---

### Room Status State Machine

```
         ┌─────────┐
    ┌────►         ├────┐
    │    │ WAITING │    │
    │    │         │    │ 2+ players join
    │    └────┬────┘    │
    │         │         │
    │         │         ▼
    │    ┌────┴──────────┐
    │    │                │
    │    │  ACTIVE        ◄───┐
    │    │                │   │
    │    └───┬───┬────────┘   │
    │        │   │             │
    │        │   │ admin       │ resume
    │        │   │ suspend     │
    │        │   │             │
    │        │   ▼             │
    │        │ ┌──────────┐    │
    │        │ │          ├────┘
    │        │ │SUSPENDED │
    │        │ │          │
    │        │ └────┬─────┘
    │        │      │
    │        │      │ close
    │        │      │
    │        ▼      ▼
    │     ┌───────────┐
    └─────┤           │
          │ COMPLETED │ (terminal state)
          │           │
          └───────────┘
```

**Valid Transitions**:
- `WAITING` → `ACTIVE` (2+ players seated)
- `WAITING` → `COMPLETED` (creator leaves, no other players)
- `ACTIVE` → `SUSPENDED` (admin action)
- `ACTIVE` → `COMPLETED` (all players leave or hand completes)
- `SUSPENDED` → `ACTIVE` (admin resumes)
- `SUSPENDED` → `COMPLETED` (admin closes)

**Transition Triggers**:
- Player join: Automatic when 2+ players seated
- Admin suspend: Manual admin action for disputes
- Auto-complete: All players leave or game naturally ends
- Admin close: Manual admin action with chip return

---

### Transaction Status State Machine

```
         ┌─────────┐
    ┌────►         │
    │    │ PENDING │
    │    │         │
    │    └────┬────┘
    │         │
    │         │ admin action
    │         ├──────┐
    │         │      │
    │         ▼      ▼
    │    ┌──────────┬──────────┐
    │    │          │          │
    │    │PROCESSING│ REJECTED │ (terminal)
    │    │          │          │
    │    └────┬─────┴──────────┘
    │         │           ▲
    │         │ gateway   │
    │         │ response  │
    │         ├───────────┘
    │         │       reject
    │         ▼
    │    ┌──────────┐
    │    │          │
    │    │COMPLETED │ (terminal)
    │    │          │
    │    └────┬─────┘
    │         │
    │         ▼
    │    ┌──────────┐
    └────┤  FAILED  │ (terminal, manual intervention)
         │          │
         └──────────┘
```

**Valid Transitions**:
- `PENDING` → `PROCESSING` (admin approval for withdrawals)
- `PENDING` → `COMPLETED` (admin approval for deposits)
- `PENDING` → `REJECTED` (admin rejection)
- `PROCESSING` → `COMPLETED` (payment gateway success)
- `PROCESSING` → `FAILED` (payment gateway error)
- `COMPLETED` → `FAILED` (reversal - rare, manual only)

**Terminal States**:
- `COMPLETED`: Transaction successfully processed
- `REJECTED`: Admin rejected the transaction
- `FAILED`: Technical failure, manual intervention required

**Immutability**:
- Transactions become immutable when entering terminal states
- `isImmutable` flag set to true
- `@BeforeUpdate()` hook prevents further modifications

---

## Database Indexes

### Index Strategy

**Primary Indexes** (automatically created):
- All `id` columns (UUID primary keys)

**Unique Indexes**:
- `users.telegramId` (unique constraint)
- `player_seats.gameHandId + position` (one player per seat)

**Single Column Indexes**:
- `users.username` (search by username)
- `users.status` (filter active/suspended/banned)
- `users.createdAt` (sort by registration date)
- `rooms.status` (filter active rooms)
- `rooms.createdBy` (user's created rooms)
- `transactions.userId` (user transaction history)
- `transactions.referenceId` (payment gateway correlation)
- `game_hands.roomId` (room hand history)
- `player_seats.gameHandId` (hand's players)
- `player_seats.userId` (user's seats)
- `betting_actions.gameHandId` (hand's actions)
- `betting_actions.playerId` (player action history)
- `audit_logs.userId` (admin action history)
- `audit_logs.eventType` (filter by event type)

**Composite Indexes** (most selective column first):
- `transactions.type + status` (pending withdrawal queries)
- `transactions.userId + createdAt` (user history with pagination)
- `rooms.status + createdAt` (active rooms sorted by date)
- `game_hands.roomId + startedAt` (room hand history)
- `betting_actions.gameHandId + timestamp` (action sequence)
- `audit_logs.entityType + entityId` (entity audit trail)

**JSONB Indexes** (PostgreSQL GIN):
- `game_hands.players` (player lookup in JSONB)

### Index Creation (Migration)

```sql
-- User indexes
CREATE UNIQUE INDEX idx_user_telegram_id ON users(telegram_id);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_user_created_at ON users(created_at DESC);

-- Room indexes
CREATE INDEX idx_room_status ON rooms(status);
CREATE INDEX idx_room_created_at ON rooms(created_at DESC);
CREATE INDEX idx_room_created_by ON rooms(created_by);
CREATE INDEX idx_room_status_created ON rooms(status, created_at DESC);

-- Transaction indexes
CREATE INDEX idx_transaction_user_id ON transactions(user_id);
CREATE INDEX idx_transaction_type_status ON transactions(type, status);
CREATE INDEX idx_transaction_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transaction_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transaction_reference_id ON transactions(reference_id);

-- GameHand indexes
CREATE INDEX idx_game_hand_room_id ON game_hands(room_id);
CREATE INDEX idx_game_hand_started_at ON game_hands(started_at DESC);
CREATE INDEX idx_game_hand_room_started ON game_hands(room_id, started_at DESC);
CREATE INDEX idx_game_hand_players ON game_hands USING GIN (players);

-- PlayerSeat indexes
CREATE INDEX idx_player_seat_game_hand_id ON player_seats(game_hand_id);
CREATE INDEX idx_player_seat_user_id ON player_seats(user_id);
CREATE UNIQUE INDEX idx_player_seat_game_position ON player_seats(game_hand_id, position);

-- BettingAction indexes
CREATE INDEX idx_betting_action_game_hand_id ON betting_actions(game_hand_id);
CREATE INDEX idx_betting_action_player_id ON betting_actions(player_id);
CREATE INDEX idx_betting_action_game_timestamp ON betting_actions(game_hand_id, timestamp);

-- AuditLog indexes
CREATE INDEX idx_audit_log_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_log_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_log_event_type ON audit_logs(event_type);
```

---

## Migration Considerations

### Initial Schema Migration

**Migration Order** (respecting foreign key dependencies):
1. `users` (no dependencies)
2. `platform_settings` (no dependencies)
3. `rooms` (depends on users)
4. `transactions` (depends on users)
5. `game_hands` (depends on rooms)
6. `player_seats` (depends on game_hands, users)
7. `betting_actions` (depends on game_hands, users)
8. `audit_logs` (depends on users)

### Data Type Considerations

**UUID Generation**:
```sql
-- Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Use uuid_generate_v4() for default values if needed
ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
```

**DECIMAL Precision**:
- All monetary values: `DECIMAL(15, 2)` (supports up to $999,999,999,999.99)
- Percentages: `DECIMAL(5, 2)` (supports 0.00% to 999.99%)

**JSONB Columns**:
- `game_hands.community_cards`: Array of strings
- `game_hands.winners`: Array of objects
- `game_hands.players`: Array of objects (indexed with GIN)
- `game_hands.actions`: Array of objects
- `audit_logs.changes`: Object with before/after snapshots

**BYTEA Columns**:
- `player_seats.hole_cards_encrypted`: Encrypted card data (AES-256)

**INET Columns**:
- `audit_logs.ip_address`: IPv4 or IPv6 addresses

### Constraints

**Check Constraints**:
```sql
-- User balance must be non-negative
ALTER TABLE users ADD CONSTRAINT chk_user_balance_positive CHECK (balance >= 0);

-- Room blind validation
ALTER TABLE rooms ADD CONSTRAINT chk_room_blinds CHECK (big_blind >= small_blind);
ALTER TABLE rooms ADD CONSTRAINT chk_room_buy_in CHECK (max_buy_in >= min_buy_in);
ALTER TABLE rooms ADD CONSTRAINT chk_room_players CHECK (current_players <= max_players);

-- GameHand dealer position
ALTER TABLE game_hands ADD CONSTRAINT chk_game_hand_dealer CHECK (dealer_position >= 0 AND dealer_position <= 8);

-- PlayerSeat position
ALTER TABLE player_seats ADD CONSTRAINT chk_player_seat_position CHECK (position >= 0 AND position <= 8);
ALTER TABLE player_seats ADD CONSTRAINT chk_player_seat_chips CHECK (chip_stack >= 0);

-- Transaction amount
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_amount CHECK (amount > 0);
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_balance CHECK (balance_before >= 0 AND balance_after >= 0);
```

**Foreign Key Constraints**:
```sql
-- Room -> User (creator)
ALTER TABLE rooms ADD CONSTRAINT fk_room_creator
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Transaction -> User
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE transactions ADD CONSTRAINT fk_transaction_processor
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL;

-- GameHand -> Room
ALTER TABLE game_hands ADD CONSTRAINT fk_game_hand_room
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- PlayerSeat -> GameHand, User
ALTER TABLE player_seats ADD CONSTRAINT fk_player_seat_game_hand
  FOREIGN KEY (game_hand_id) REFERENCES game_hands(id) ON DELETE CASCADE;

ALTER TABLE player_seats ADD CONSTRAINT fk_player_seat_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- BettingAction -> GameHand, User
ALTER TABLE betting_actions ADD CONSTRAINT fk_betting_action_game_hand
  FOREIGN KEY (game_hand_id) REFERENCES game_hands(id) ON DELETE CASCADE;

ALTER TABLE betting_actions ADD CONSTRAINT fk_betting_action_player
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE RESTRICT;

-- AuditLog -> User
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_log_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

### Performance Optimization

**Partitioning** (for large tables):
```sql
-- Partition audit_logs by month for better query performance
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

**Table Maintenance**:
```sql
-- Vacuum and analyze after bulk operations
VACUUM ANALYZE users;
VACUUM ANALYZE transactions;
VACUUM ANALYZE game_hands;

-- Reindex periodically (monthly recommended)
REINDEX TABLE users;
REINDEX TABLE transactions;
```

### Backup & Recovery

**Backup Strategy**:
- Full database backup: Daily at 3 AM UTC
- Transaction log backup: Every 15 minutes
- Point-in-time recovery capability: 7 days
- Replica for read queries and failover

**Critical Tables** (priority backup):
1. `transactions` (financial data - immutable)
2. `users` (account data - updated frequently)
3. `audit_logs` (compliance - immutable)
4. `game_hands` (game history - archival)

### Seed Data

**Initial Platform Settings**:
```sql
INSERT INTO platform_settings (
  id,
  default_small_blind,
  default_big_blind,
  max_room_size,
  action_timer_seconds,
  disconnect_timeout_seconds,
  min_deposit_amount,
  max_deposit_amount,
  min_withdrawal_amount,
  max_withdrawal_amount,
  withdrawal_fee_percent,
  maintenance_mode,
  allow_room_creation,
  allow_deposits,
  allow_withdrawals
) VALUES (
  uuid_generate_v4(),
  0.50,
  1.00,
  9,
  30,
  60,
  10.00,
  10000.00,
  10.00,
  5000.00,
  0.00,
  false,
  true,
  true,
  true
);
```

**Initial Admin User** (for testing):
```sql
INSERT INTO users (
  id,
  telegram_id,
  username,
  balance,
  role,
  status
) VALUES (
  uuid_generate_v4(),
  123456789,
  'admin',
  0.00,
  'admin',
  'active'
);
```

---

## Entity Lifecycle Hooks

### User Entity Hooks

**@BeforeInsert()**:
- Set `createdAt` timestamp
- Validate `balance >= 0`
- Hash sensitive data if needed

**@BeforeUpdate()**:
- Validate `balance >= 0`
- Validate status transitions
- Log balance changes to audit log

### Transaction Entity Hooks

**@BeforeInsert()**:
- Calculate `balanceAfter` from `balanceBefore + amount`
- Validate reconciliation
- Set `createdAt` timestamp

**@BeforeUpdate()**:
- Check `isImmutable` flag
- Prevent updates to completed/rejected transactions
- Validate balance reconciliation

### Room Entity Hooks

**@BeforeInsert()**:
- Validate blind levels
- Validate buy-in ranges
- Set `createdAt` timestamp

**@BeforeUpdate()**:
- Validate `currentPlayers <= maxPlayers`
- Validate status transitions
- Update `updatedAt` timestamp

### GameHand Entity Hooks

**@BeforeInsert()**:
- Validate `dealerPosition` (0-8)
- Validate `handNumber > 0`
- Set `startedAt` timestamp

**@AfterInsert()**:
- Create initial `PlayerSeat` records for all players
- Post blinds as initial `BettingAction` records

### PlayerSeat Entity Hooks

**@BeforeInsert()**:
- Validate `position` (0-8)
- Validate `chipStack > 0`
- Encrypt `holeCards`

**@BeforeUpdate()**:
- Validate `chipStack >= 0`
- Validate `currentBet >= 0`
- Track timeout count

---

## TypeORM Configuration

### Database Connection

```typescript
// ormconfig.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'poker_platform',
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false, // NEVER true in production
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true',
  extra: {
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});
```

### Entity Registration

```typescript
// entities/index.ts
export { User, UserRole, UserStatus } from './user.entity';
export { Room, RoomStatus } from './room.entity';
export { GameHand, HandPhase, WinnerInfo, PlayerInfo, ActionSummary } from './game-hand.entity';
export { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
export { PlayerSeat, SeatStatus } from './player-seat.entity';
export { BettingAction, BettingActionType } from './betting-action.entity';
export { AuditLog, EventType, EntityType } from './audit-log.entity';
export { PlatformSettings } from './platform-settings.entity';
```

---

## Validation Summary

### class-validator Decorators Used

| Decorator | Purpose | Applied To |
|-----------|---------|------------|
| `@IsNotEmpty()` | Required field | All entity IDs, usernames, etc. |
| `@IsString()` | String validation | username, name, notes |
| `@IsUrl()` | URL format | avatarUrl |
| `@IsEnum()` | Enum validation | All enum fields |
| `@IsDecimal()` | Decimal validation | balance, amounts, blinds |
| `@IsInt()` | Integer validation | position, maxPlayers, handNumber |
| `@IsBoolean()` | Boolean validation | hasActed, maintenanceMode |
| `@IsUUID()` | UUID format | All UUID foreign keys |
| `@IsIP()` | IP address | ipAddress in AuditLog |
| `@Min()` | Minimum value | balance (0), position (0), amount (0.01) |
| `@Max()` | Maximum value | position (8), maxPlayers (9) |
| `@Length()` | String length | username (1-255), notes (0-1000) |

### Custom Validation Logic

**Balance Reconciliation**:
```typescript
private calculateExpectedBalance(): number {
  switch (this.type) {
    case TransactionType.DEPOSIT:
    case TransactionType.GAME_WIN:
      return this.balanceBefore + this.amount;
    case TransactionType.WITHDRAWAL:
    case TransactionType.GAME_LOSS:
      return this.balanceBefore - this.amount;
  }
}
```

**Status Transition Validation**:
```typescript
validateStatusTransition(oldStatus: UserStatus, newStatus: UserStatus): boolean {
  const validTransitions = {
    [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.BANNED],
    [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.BANNED],
    [UserStatus.BANNED]: [],
  };
  return validTransitions[oldStatus]?.includes(newStatus) || false;
}
```

---

## Summary

This data model specification provides:

1. **8 Core Entities** with complete TypeORM definitions
2. **Comprehensive Validation** using class-validator decorators
3. **Relationship Mappings** with proper cascade behaviors
4. **State Machines** for User, Room, and Transaction status
5. **Index Strategy** optimized for query patterns
6. **Migration Guidelines** with proper ordering and constraints
7. **Security Considerations** for sensitive data (encrypted hole cards)
8. **Audit Trail** for all critical operations
9. **JSONB Usage** for flexible data structures
10. **PostgreSQL Features** (UUID, INET, JSONB, GIN indexes)

All requirements FR-001 through FR-120 are mapped to entity definitions with appropriate validation rules, indexes, and relationships to ensure data integrity, performance, and auditability.

---

**Next Steps**:
1. Generate TypeORM migration files from entity definitions
2. Implement entity repositories with custom query methods
3. Write unit tests for entity validation rules
4. Document API contracts that consume these entities
5. Set up database replication and backup strategy

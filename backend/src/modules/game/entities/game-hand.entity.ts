import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import {
  IsInt,
  IsDecimal,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Room } from '../../room/entities/room.entity';

export enum HandPhase {
  PREFLOP = 'preflop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river',
  SHOWDOWN = 'showdown',
  COMPLETED = 'completed',
}

export interface WinnerInfo {
  userId: string;
  amount: number;
  handRank: string;
  handCards: string[];
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

@Entity('game_hands')
@Index('idx_game_hand_room_id', ['roomId'])
@Index('idx_game_hand_started_at', ['startedAt'])
@Index('idx_game_hand_room_started', ['roomId', 'startedAt'])
export class GameHand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  roomId!: string;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(1)
  handNumber!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  smallBlind!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  bigBlind!: number;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(0)
  @Max(8)
  dealerPosition!: number;

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  communityCards!: string[] | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  potAmount!: number;

  @Column({ type: 'jsonb', nullable: true })
  winners!: WinnerInfo[] | null;

  @Column({ type: 'jsonb', nullable: false })
  @IsArray()
  players!: PlayerInfo[];

  @Column({ type: 'jsonb', nullable: true })
  @IsArray()
  actions!: ActionSummary[] | null;

  @Column({
    type: 'enum',
    enum: HandPhase,
    default: HandPhase.PREFLOP,
  })
  @IsEnum(HandPhase)
  currentPhase!: HandPhase;

  @Column({ type: 'timestamp', nullable: false })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  @IsInt()
  @Min(0)
  durationSeconds!: number | null;

  // Relationships
  @ManyToOne(() => Room)
  @JoinColumn({ name: 'roomId' })
  room!: Room;

  // Lifecycle hooks
  @BeforeInsert()
  validateGameHand(): void {
    if (this.dealerPosition < 0 || this.dealerPosition > 8) {
      throw new Error('Dealer position must be between 0 and 8');
    }
    if (this.handNumber < 1) {
      throw new Error('Hand number must be positive');
    }
  }
}

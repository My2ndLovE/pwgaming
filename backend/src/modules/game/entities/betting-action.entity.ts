import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
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
  IsEnum,
  IsUUID,
} from 'class-validator';
import { GameHand, HandPhase } from './game-hand.entity';
import { User } from '../../auth/entities/user.entity';

export enum ActionType {
  FOLD = 'fold',
  CHECK = 'check',
  CALL = 'call',
  BET = 'bet',
  RAISE = 'raise',
  ALL_IN = 'all_in',
}

@Entity('betting_actions')
@Index('idx_betting_action_game_hand_id', ['gameHandId'])
@Index('idx_betting_action_player_id', ['playerId'])
@Index('idx_betting_action_game_sequence', ['gameHandId', 'sequenceNumber'])
@Index('idx_betting_action_created_at', ['createdAt'])
export class BettingAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  gameHandId!: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  playerId!: string;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(0)
  @Max(8)
  position!: number;

  @Column({
    type: 'enum',
    enum: ActionType,
    nullable: false,
  })
  @IsEnum(ActionType)
  action!: ActionType;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  amount!: number;

  @Column({
    type: 'enum',
    enum: HandPhase,
    nullable: false,
  })
  @IsEnum(HandPhase)
  phase!: HandPhase;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(1)
  sequenceNumber!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  chipStackBefore!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  chipStackAfter!: number;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(0)
  timeToActMs!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => GameHand)
  @JoinColumn({ name: 'gameHandId' })
  gameHand!: GameHand;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'playerId' })
  player!: User;

  // Lifecycle hooks
  @BeforeInsert()
  validateAction(): void {
    if (this.position < 0 || this.position > 8) {
      throw new Error('Position must be between 0 and 8');
    }
    if (this.sequenceNumber < 1) {
      throw new Error('Sequence number must be positive');
    }
    if (this.chipStackAfter > this.chipStackBefore) {
      throw new Error('Chip stack cannot increase after action');
    }
  }
}

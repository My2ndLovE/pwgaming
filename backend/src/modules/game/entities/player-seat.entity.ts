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
  IsUUID,
} from 'class-validator';
import { GameHand } from './game-hand.entity';
import { User } from '../../auth/entities/user.entity';

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
@Index('idx_player_seat_game_position', ['gameHandId', 'position'], {
  unique: true,
})
export class PlayerSeat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  gameHandId!: string;

  @Column({ type: 'int', nullable: false })
  @IsInt()
  @Min(0)
  @Max(8)
  position!: number;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  chipStack!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  currentBet!: number;

  @Column({ type: 'bytea', nullable: true })
  holeCardsEncrypted!: Buffer | null;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.ACTIVE,
  })
  @IsEnum(SeatStatus)
  status!: SeatStatus;

  @Column({ type: 'boolean', default: false })
  hasActed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastActionAt!: Date | null;

  // Relationships
  @ManyToOne(() => GameHand)
  @JoinColumn({ name: 'gameHandId' })
  gameHand!: GameHand;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateSeat(): void {
    if (this.chipStack < 0) {
      throw new Error('Chip stack cannot be negative');
    }
    if (this.currentBet < 0) {
      throw new Error('Current bet cannot be negative');
    }
    if (this.position < 0 || this.position > 8) {
      throw new Error('Position must be between 0 and 8');
    }
  }
}

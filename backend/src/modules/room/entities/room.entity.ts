import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
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
import { User } from '../../auth/entities/user.entity';

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
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  smallBlind!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.02)
  bigBlind!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  minBuyIn!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  maxBuyIn!: number;

  @Column({ type: 'int', default: 9 })
  @IsInt()
  @Min(2)
  @Max(9)
  maxPlayers!: number;

  @Column({ type: 'int', default: 0 })
  @IsInt()
  @Min(0)
  @Max(9)
  currentPlayers!: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  @IsEnum(RoomStatus)
  status!: RoomStatus;

  @Column({ type: 'uuid', nullable: false })
  createdBy!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  suspensionReason!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateBlindsAndBuyIns(): void {
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

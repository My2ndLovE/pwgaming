import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
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
  id!: string;

  @Column({ type: 'bigint', unique: true, nullable: false })
  @IsNotEmpty()
  telegramId!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  username!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsUrl()
  avatarUrl!: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  balance!: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  suspensionReason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateBalance(): void {
    if (this.balance < 0) {
      throw new Error('Balance cannot be negative');
    }
  }

  @BeforeUpdate()
  validateStatusTransition(): void {
    // Validate status transitions in service layer
    // Valid transitions:
    // ACTIVE -> SUSPENDED, BANNED
    // SUSPENDED -> ACTIVE, BANNED
    // BANNED -> (no transitions allowed)
  }
}

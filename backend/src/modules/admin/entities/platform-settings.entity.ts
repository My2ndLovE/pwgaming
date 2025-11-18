import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  BeforeUpdate,
} from 'typeorm';
import { IsDecimal, IsInt, Min, Max, IsBoolean, Length } from 'class-validator';

@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Game Settings
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.5 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  defaultSmallBlind!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 1.0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.02)
  defaultBigBlind!: number;

  @Column({ type: 'int', default: 9 })
  @IsInt()
  @Min(2)
  @Max(9)
  maxRoomSize!: number;

  @Column({ type: 'int', default: 30 })
  @IsInt()
  @Min(10)
  @Max(120)
  actionTimerSeconds!: number;

  @Column({ type: 'int', default: 60 })
  @IsInt()
  @Min(30)
  @Max(300)
  disconnectTimeoutSeconds!: number;

  // Financial Settings
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  minDepositAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10000 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  maxDepositAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 10 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  minWithdrawalAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 5000 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(1)
  maxWithdrawalAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  @Max(10)
  withdrawalFeePercent!: number;

  // System Settings
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  maintenanceMode!: boolean;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  maintenanceMessage!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Length(0, 500)
  announcementBanner!: string | null;

  @Column({ type: 'int', default: 100 })
  @IsInt()
  @Min(10)
  @Max(1000)
  rateLimitPerMinute!: number;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowNewRegistrations!: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowRoomCreation!: boolean;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy!: string | null;

  // Lifecycle hooks
  @BeforeUpdate()
  validateSettings(): void {
    if (this.defaultBigBlind < this.defaultSmallBlind) {
      throw new Error('Big blind must be greater than or equal to small blind');
    }
    if (this.maxDepositAmount < this.minDepositAmount) {
      throw new Error(
        'Max deposit must be greater than or equal to min deposit',
      );
    }
    if (this.maxWithdrawalAmount < this.minWithdrawalAmount) {
      throw new Error(
        'Max withdrawal must be greater than or equal to min withdrawal',
      );
    }
  }
}

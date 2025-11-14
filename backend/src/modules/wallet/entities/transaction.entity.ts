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
import { User } from '../../auth/entities/user.entity';

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
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.01)
  amount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  balanceBefore!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  balanceAfter!: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Length(0, 255)
  referenceId!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  @Length(0, 1000)
  notes!: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  processedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  isImmutable!: boolean;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedBy' })
  processor!: User | null;

  // Lifecycle hooks
  @BeforeUpdate()
  validateImmutability(): void {
    if (this.isImmutable) {
      throw new Error('Cannot modify completed or rejected transaction');
    }
  }

  @BeforeUpdate()
  validateBalanceReconciliation(): void {
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

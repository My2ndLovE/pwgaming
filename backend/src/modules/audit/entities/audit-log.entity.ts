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
import { User } from '../../auth/entities/user.entity';

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
  id!: string;

  @Column({
    type: 'enum',
    enum: EventType,
    nullable: false,
  })
  @IsEnum(EventType)
  @IsNotEmpty()
  eventType!: EventType;

  @Column({
    type: 'enum',
    enum: EntityType,
    nullable: false,
  })
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType!: EntityType;

  @Column({ type: 'uuid', nullable: false })
  @IsUUID()
  @IsNotEmpty()
  entityId!: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  userId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  action!: string;

  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, any> | null;

  @Column({ type: 'inet', nullable: true })
  @IsIP()
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Length(0, 500)
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Length(0, 100)
  serverNode!: string | null;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameHand } from './game-hand.entity';
import { Room } from '../../room/entities/room.entity';

/**
 * RakeHistory entity tracks all rake collected from poker hands
 * Used for accounting, reporting, and financial auditing
 */
@Entity('rake_history')
export class RakeHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'hand_id', type: 'uuid' })
  handId!: string;

  @ManyToOne(() => GameHand, { nullable: true })
  @JoinColumn({ name: 'hand_id' })
  hand?: GameHand;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @Column({ name: 'pot_amount', type: 'decimal', precision: 10, scale: 2 })
  potAmount!: number;

  @Column({ name: 'rake_amount', type: 'decimal', precision: 10, scale: 2 })
  rakeAmount!: number;

  @Column({ name: 'rake_percentage', type: 'decimal', precision: 5, scale: 2 })
  rakePercentage!: number;

  @Column({ name: 'pot_after_rake', type: 'decimal', precision: 10, scale: 2 })
  potAfterRake!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'small_blind', type: 'decimal', precision: 10, scale: 2 })
  smallBlind!: number;

  @Column({ name: 'big_blind', type: 'decimal', precision: 10, scale: 2 })
  bigBlind!: number;

  @Column({ name: 'num_players', type: 'int' })
  numPlayers!: number;
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { User } from '../../auth/entities/user.entity';

export interface BuyInDto {
  userId: string;
  roomId: string;
  buyInAmount: number;
  bigBlind: number;
}

export interface CashOutDto {
  userId: string;
  roomId: string;
  chipStack: number;
}

export interface RebuyDto {
  userId: string;
  roomId: string;
  rebuyAmount: number;
  bigBlind: number;
}

export interface BuyInValidation {
  isValid: boolean;
  error?: string;
  minBuyIn: number;
  maxBuyIn: number;
}

/**
 * GameWalletService handles wallet integration with poker gameplay
 * Manages buy-ins, cash-outs, and rebuys with atomic transactions
 */
@Injectable()
export class GameWalletService {
  private readonly MIN_BB_BUYIN = 20; // Minimum 20 big blinds
  private readonly MAX_BB_BUYIN = 100; // Maximum 100 big blinds

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Validate buy-in amount according to poker rules
   * Must be 20-100 big blinds
   */
  async validateBuyIn(dto: BuyInDto): Promise<BuyInValidation> {
    const minBuyIn = this.MIN_BB_BUYIN * dto.bigBlind;
    const maxBuyIn = this.MAX_BB_BUYIN * dto.bigBlind;

    if (dto.buyInAmount < minBuyIn) {
      return {
        isValid: false,
        error: `Buy-in must be at least ${this.MIN_BB_BUYIN} big blinds (${minBuyIn})`,
        minBuyIn,
        maxBuyIn,
      };
    }

    if (dto.buyInAmount > maxBuyIn) {
      return {
        isValid: false,
        error: `Buy-in cannot exceed ${this.MAX_BB_BUYIN} big blinds (${maxBuyIn})`,
        minBuyIn,
        maxBuyIn,
      };
    }

    // Check if user has sufficient balance
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      select: ['id', 'balance'],
    });

    if (!user) {
      return {
        isValid: false,
        error: 'User not found',
        minBuyIn,
        maxBuyIn,
      };
    }

    if (Number(user.balance) < dto.buyInAmount) {
      return {
        isValid: false,
        error: `Insufficient balance. Required: ${dto.buyInAmount}, Available: ${user.balance}`,
        minBuyIn,
        maxBuyIn,
      };
    }

    return {
      isValid: true,
      minBuyIn,
      maxBuyIn,
    };
  }

  /**
   * Process buy-in: Deduct from wallet, add chips to game
   * Uses atomic transaction to prevent race conditions
   *
   * @returns Transaction record
   */
  async processBuyIn(dto: BuyInDto): Promise<Transaction> {
    // Validate first
    const validation = await this.validateBuyIn(dto);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user row to prevent concurrent buy-ins
      const user = await queryRunner.manager.findOne(User, {
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore - dto.buyInAmount;

      if (balanceAfter < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct buy-in from wallet
      user.balance = balanceAfter;
      await queryRunner.manager.save(user);

      // Create transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        userId: dto.userId,
        type: TransactionType.GAME_BUYIN,
        amount: dto.buyInAmount,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.COMPLETED,
        referenceId: dto.roomId,
        notes: `Buy-in for room ${dto.roomId}`,
        isImmutable: true,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process cash-out: Return chips to wallet when player leaves
   * Called when player voluntarily leaves or is removed from table
   *
   * @param chipStack - Remaining chips to return to wallet
   */
  async processCashOut(dto: CashOutDto): Promise<Transaction> {
    if (dto.chipStack < 0) {
      throw new BadRequestException('Chip stack cannot be negative');
    }

    // If player has no chips, no transaction needed
    if (dto.chipStack === 0) {
      return this.createZeroCashOutRecord(dto);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore + dto.chipStack;

      // Credit chips back to wallet
      user.balance = balanceAfter;
      await queryRunner.manager.save(user);

      // Create transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        userId: dto.userId,
        type: TransactionType.GAME_CASHOUT,
        amount: dto.chipStack,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.COMPLETED,
        referenceId: dto.roomId,
        notes: `Cash-out from room ${dto.roomId}`,
        isImmutable: true,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create audit record for zero-chip cash-out (player lost everything)
   */
  private async createZeroCashOutRecord(dto: CashOutDto): Promise<Transaction> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      select: ['id', 'balance'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const balance = Number(user.balance);

    return this.transactionRepository.save({
      userId: dto.userId,
      type: TransactionType.GAME_CASHOUT,
      amount: 0,
      balanceBefore: balance,
      balanceAfter: balance,
      status: TransactionStatus.COMPLETED,
      referenceId: dto.roomId,
      notes: `Cash-out from room ${dto.roomId} (no chips remaining)`,
      isImmutable: true,
    });
  }

  /**
   * Process rebuy: Add more chips between hands
   * Validates same rules as buy-in (20-100 BB)
   * Can only rebuy between hands, not during active hand
   */
  async processRebuy(dto: RebuyDto): Promise<Transaction> {
    // Use same validation as buy-in
    const buyInDto: BuyInDto = {
      userId: dto.userId,
      roomId: dto.roomId,
      buyInAmount: dto.rebuyAmount,
      bigBlind: dto.bigBlind,
    };

    const validation = await this.validateBuyIn(buyInDto);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: dto.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const balanceBefore = Number(user.balance);
      const balanceAfter = balanceBefore - dto.rebuyAmount;

      if (balanceAfter < 0) {
        throw new BadRequestException('Insufficient balance for rebuy');
      }

      // Deduct rebuy amount from wallet
      user.balance = balanceAfter;
      await queryRunner.manager.save(user);

      // Create transaction record
      const transaction = queryRunner.manager.create(Transaction, {
        userId: dto.userId,
        type: TransactionType.GAME_REBUY,
        amount: dto.rebuyAmount,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.COMPLETED,
        referenceId: dto.roomId,
        notes: `Rebuy for room ${dto.roomId}`,
        isImmutable: true,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get buy-in limits for a room
   */
  getBuyInLimits(bigBlind: number): { min: number; max: number } {
    return {
      min: this.MIN_BB_BUYIN * bigBlind,
      max: this.MAX_BB_BUYIN * bigBlind,
    };
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { User } from '../../auth/entities/user.entity';
import { BalanceService } from './balance.service';

export interface CreateDepositDto {
  userId: string;
  amount: number;
  notes?: string;
}

export interface CreateWithdrawalDto {
  userId: string;
  amount: number;
  notes?: string;
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly balanceService: BalanceService,
    private readonly dataSource: DataSource,
  ) {}

  async createDeposit(dto: CreateDepositDto): Promise<Transaction> {
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const transaction = this.transactionRepository.create({
      userId: dto.userId,
      type: TransactionType.DEPOSIT,
      amount: dto.amount,
      balanceBefore: Number(user.balance),
      balanceAfter: Number(user.balance), // Will be updated on approval
      status: TransactionStatus.PENDING,
      notes: dto.notes,
      isImmutable: false,
    });

    return await this.transactionRepository.save(transaction);
  }

  async createWithdrawal(dto: CreateWithdrawalDto): Promise<Transaction> {
    // Validate balance before creating withdrawal
    const hasBalance = await this.balanceService.validateBalance(dto.userId, dto.amount);
    if (!hasBalance) {
      throw new BadRequestException('Insufficient balance for withdrawal');
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

      const currentBalance = Number(user.balance);
      const newBalance = currentBalance - dto.amount;

      if (newBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct balance immediately (will be restored if rejected)
      const balanceBefore = currentBalance;
      const balanceAfter = newBalance;

      user.balance = newBalance;
      await queryRunner.manager.save(user);

      const transaction = queryRunner.manager.create(Transaction, {
        userId: dto.userId,
        type: TransactionType.WITHDRAWAL,
        amount: dto.amount,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.PENDING,
        notes: dto.notes,
        isImmutable: false,
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

  async getTransactionHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { transactions, total };
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return await this.transactionRepository.findOne({ where: { id } });
  }

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
    });
  }
}

import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { User } from '../../auth/entities/user.entity';

export interface AdminCreditDto {
  userId: string;
  amount: number;
  reason: string;
  adminId: string;
}

export interface AdminDebitDto {
  userId: string;
  amount: number;
  reason: string;
  adminId: string;
}

/**
 * AdminWalletService provides manual wallet operations for admins
 * PERMANENT FEATURE - Available in both internal and external wallet modes
 *
 * Production Use Cases:
 * - Payment gateway downtime/maintenance recovery
 * - Manual reversal of disputed transactions
 * - Promotional bonuses and referral rewards
 * - Bug compensation and goodwill credits
 * - VIP/whale custom payment arrangements
 * - Regulatory compliance (freeze/unfreeze funds)
 * - Emergency balance corrections
 *
 * MVP/Early Launch (WALLET_MODE=internal):
 * - All deposits via admin credit (no gateway)
 * - Manual approval workflow
 * - Testing with trusted users
 *
 * Production (WALLET_MODE=external):
 * - Admin credit/debit still available for edge cases
 * - Automated deposits via payment gateway
 * - Manual operations logged with admin ID and reason
 */
@Injectable()
export class AdminWalletService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if internal wallet mode is enabled
   */
  isInternalMode(): boolean {
    const walletMode = this.configService.get<string>('WALLET_MODE', 'internal');
    return walletMode === 'internal';
  }

  /**
   * Verify admin can perform wallet operations
   */
  private async verifyAdminPermission(adminId: string): Promise<void> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
      select: ['id', 'role'],
    });

    if (!admin || admin.role !== 'admin') {
      throw new ForbiddenException('Only admins can perform wallet operations');
    }
  }

  /**
   * Credit user balance directly (internal mode only)
   * @throws ForbiddenException if not in internal mode
   */
  async creditUser(dto: AdminCreditDto): Promise<Transaction> {
    if (!this.isInternalMode()) {
      throw new ForbiddenException('Direct credits only available in internal wallet mode');
    }

    await this.verifyAdminPermission(dto.adminId);

    if (dto.amount <= 0) {
      throw new BadRequestException('Credit amount must be positive');
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
      const balanceAfter = balanceBefore + dto.amount;

      user.balance = balanceAfter;
      await queryRunner.manager.save(user);

      const transaction = queryRunner.manager.create(Transaction, {
        userId: dto.userId,
        type: TransactionType.ADMIN_CREDIT,
        amount: dto.amount,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.COMPLETED,
        notes: dto.reason,
        processedBy: dto.adminId,
        processedAt: new Date(),
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
   * Debit user balance directly (internal mode only)
   * Use for: penalties, reversals, corrections
   */
  async debitUser(dto: AdminDebitDto): Promise<Transaction> {
    if (!this.isInternalMode()) {
      throw new ForbiddenException('Direct debits only available in internal wallet mode');
    }

    await this.verifyAdminPermission(dto.adminId);

    if (dto.amount <= 0) {
      throw new BadRequestException('Debit amount must be positive');
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
      const balanceAfter = balanceBefore - dto.amount;

      if (balanceAfter < 0) {
        throw new BadRequestException('Insufficient balance for debit');
      }

      user.balance = balanceAfter;
      await queryRunner.manager.save(user);

      const transaction = queryRunner.manager.create(Transaction, {
        userId: dto.userId,
        type: TransactionType.ADMIN_DEBIT,
        amount: dto.amount,
        balanceBefore,
        balanceAfter,
        status: TransactionStatus.COMPLETED,
        notes: dto.reason,
        processedBy: dto.adminId,
        processedAt: new Date(),
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
   * Get wallet mode status for admin dashboard
   */
  getWalletModeStatus(): { mode: string; features: string[] } {
    const mode = this.configService.get<string>('WALLET_MODE', 'internal');

    if (mode === 'internal') {
      return {
        mode: 'internal',
        features: [
          'Admin can credit/debit user balances',
          'No payment gateway integration',
          'Manual approval for all transactions',
          'Suitable for testing and early launch',
        ],
      };
    } else {
      return {
        mode: 'external',
        features: [
          'Payment gateway integration active',
          'Automated deposit processing',
          'Manual withdrawal approval only',
          'Production-ready payment flow',
        ],
      };
    }
  }
}

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../../wallet/entities/transaction.entity';
import { User } from '../../auth/entities/user.entity';
import { AuditLog, EventType, EntityType } from '../../audit/entities/audit-log.entity';

@Injectable()
export class WithdrawalManagementService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getPendingWithdrawals(): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: {
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
      relations: ['user'],
    });
  }

  async approveWithdrawal(
    withdrawalId: string,
    adminId: string,
    ipAddress?: string,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: withdrawalId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (transaction.type !== TransactionType.WITHDRAWAL) {
        throw new BadRequestException('Transaction is not a withdrawal');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Withdrawal is not pending');
      }

      if (transaction.isImmutable) {
        throw new BadRequestException('Transaction is immutable');
      }

      // Mark as completed
      transaction.status = TransactionStatus.COMPLETED;
      transaction.processedBy = adminId;
      transaction.processedAt = new Date();
      transaction.isImmutable = true;

      await queryRunner.manager.save(transaction);

      // Create audit log
      const auditLog = queryRunner.manager.create(AuditLog, {
        eventType: EventType.WITHDRAWAL_APPROVED,
        entityType: EntityType.TRANSACTION,
        entityId: transaction.id,
        userId: adminId,
        action: `Approved withdrawal of ${transaction.amount} for user ${transaction.userId}`,
        changes: {
          before: { status: TransactionStatus.PENDING },
          after: { status: TransactionStatus.COMPLETED },
          amount: transaction.amount,
        },
        ipAddress,
      });

      await queryRunner.manager.save(auditLog);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectWithdrawal(
    withdrawalId: string,
    adminId: string,
    reason: string,
    ipAddress?: string,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: withdrawalId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (transaction.type !== TransactionType.WITHDRAWAL) {
        throw new BadRequestException('Transaction is not a withdrawal');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Withdrawal is not pending');
      }

      if (transaction.isImmutable) {
        throw new BadRequestException('Transaction is immutable');
      }

      // Restore user balance
      const user = await queryRunner.manager.findOne(User, {
        where: { id: transaction.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (user) {
        user.balance = Number(user.balance) + Number(transaction.amount);
        await queryRunner.manager.save(user);
      }

      // Mark as rejected
      transaction.status = TransactionStatus.REJECTED;
      transaction.processedBy = adminId;
      transaction.processedAt = new Date();
      transaction.notes = reason;
      transaction.isImmutable = true;
      transaction.balanceAfter = transaction.balanceBefore; // Balance restored

      await queryRunner.manager.save(transaction);

      // Create audit log
      const auditLog = queryRunner.manager.create(AuditLog, {
        eventType: EventType.WITHDRAWAL_REJECTED,
        entityType: EntityType.TRANSACTION,
        entityId: transaction.id,
        userId: adminId,
        action: `Rejected withdrawal of ${transaction.amount} for user ${transaction.userId}`,
        changes: {
          before: { status: TransactionStatus.PENDING },
          after: { status: TransactionStatus.REJECTED },
          amount: transaction.amount,
          reason,
        },
        ipAddress,
      });

      await queryRunner.manager.save(auditLog);
      await queryRunner.commitTransaction();

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

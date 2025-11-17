import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<Transaction[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  async findByType(type: TransactionType): Promise<Transaction[]> {
    return this.repository.find({
      where: { type },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: TransactionStatus): Promise<Transaction[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'ASC' },
    });
  }

  async findPendingByType(type: TransactionType): Promise<Transaction[]> {
    return this.repository.find({
      where: { type, status: TransactionStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  async create(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repository.create(data);
    return this.repository.save(transaction);
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    await this.repository.update(id, data);
    const transaction = await this.findById(id);
    if (!transaction) {
      throw new Error(`Transaction with id ${id} not found after update`);
    }
    return transaction;
  }

  async count(where?: FindOptionsWhere<Transaction>): Promise<number> {
    return this.repository.count({ where });
  }

  async findAll(options?: FindOptionsWhere<Transaction>): Promise<Transaction[]> {
    return this.repository.find({ where: options, order: { createdAt: 'DESC' } });
  }
}

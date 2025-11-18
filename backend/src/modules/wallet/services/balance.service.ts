import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return Number(user.balance);
  }

  async updateBalance(
    userId: string,
    amount: number,
    queryRunner?: QueryRunner,
  ): Promise<number> {
    const repository = queryRunner
      ? queryRunner.manager.getRepository(User)
      : this.userRepository;

    // Use pessimistic locking for concurrent safety
    const user = await repository.findOne({
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const currentBalance = Number(user.balance);
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    user.balance = newBalance;
    await repository.save(user);

    return newBalance;
  }

  async validateBalance(
    userId: string,
    requiredAmount: number,
  ): Promise<boolean> {
    const balance = await this.getUserBalance(userId);
    return balance >= requiredAmount;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Find a user by Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.repository.findOne({ where: { telegramId } });
  }

  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({ where: { username } });
  }

  /**
   * Create a new user
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  /**
   * Update a user
   */
  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.repository.update(id, userData);
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found after update`);
    }
    return user;
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Find all users with optional filtering
   */
  async findAll(options?: FindOptionsWhere<User>): Promise<User[]> {
    return this.repository.find({ where: options });
  }

  /**
   * Find active users
   */
  async findActiveUsers(): Promise<User[]> {
    return this.repository.find({
      where: { status: UserStatus.ACTIVE },
    });
  }

  /**
   * Find suspended users
   */
  async findSuspendedUsers(): Promise<User[]> {
    return this.repository.find({
      where: { status: UserStatus.SUSPENDED },
    });
  }

  /**
   * Count total users
   */
  async count(options?: FindOptionsWhere<User>): Promise<number> {
    return this.repository.count({ where: options });
  }

  /**
   * Save a user (create or update)
   */
  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.repository.update(id, { lastLogin: new Date() });
  }

  /**
   * Suspend a user
   */
  async suspendUser(id: string, reason: string): Promise<User> {
    await this.repository.update(id, {
      status: UserStatus.SUSPENDED,
      suspensionReason: reason,
    });
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found after suspension`);
    }
    return user;
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(id: string): Promise<User> {
    await this.repository.update(id, {
      status: UserStatus.ACTIVE,
      suspensionReason: null,
    });
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found after unsuspension`);
    }
    return user;
  }

  /**
   * Ban a user
   */
  async banUser(id: string, reason: string): Promise<User> {
    await this.repository.update(id, {
      status: UserStatus.BANNED,
      suspensionReason: reason,
    });
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found after ban`);
    }
    return user;
  }
}

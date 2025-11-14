import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole, UserStatus } from '../entities/user.entity';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface JwtPayload {
  sub: string;
  telegramId: number;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<User> {
    // For MVP: simplified validation
    // Production: Use @tma.js/init-data-node for proper validation
    try {
      const userData = this.parseTelegramInitData(initData);
      return await this.findOrCreateUser(userData);
    } catch (error) {
      throw new UnauthorizedException('Invalid Telegram authentication');
    }
  }

  async findOrCreateUser(telegramUser: TelegramUser): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId: telegramUser.id },
    });

    if (!user) {
      user = this.userRepository.create({
        telegramId: telegramUser.id,
        username: telegramUser.username || `user_${telegramUser.id}`,
        avatarUrl: telegramUser.photo_url || null,
        balance: 0,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
      });
      user = await this.userRepository.save(user);
    } else {
      user.lastLogin = new Date();
      await this.userRepository.save(user);
    }

    return user;
  }

  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      telegramId: user.telegramId,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  private parseTelegramInitData(initData: string): TelegramUser {
    // Simplified parsing for MVP
    const params = new URLSearchParams(initData);
    const userJson = params.get('user');
    if (!userJson) {
      throw new Error('No user data in initData');
    }
    return JSON.parse(userJson);
  }
}

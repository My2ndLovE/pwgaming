import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { TelegramAuthService } from './telegram-auth.service';

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
    private readonly telegramAuthService: TelegramAuthService,
    private readonly configService: ConfigService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<User> {
    // Get bot token from environment
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot token not configured');
    }

    try {
      // Validate signature using TelegramAuthService
      await this.telegramAuthService.validateInitData(initData, botToken);

      // Parse user data after validation
      const telegramUserData = await this.telegramAuthService.parseUserData(initData);

      // Convert to internal TelegramUser format
      const userData: TelegramUser = {
        id: telegramUserData.id,
        first_name: telegramUserData.first_name,
        last_name: telegramUserData.last_name,
        username: telegramUserData.username,
        photo_url: telegramUserData.photo_url,
      };

      return await this.findOrCreateUser(userData);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramAuthService } from '../services/telegram-auth.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(
    private readonly telegramAuthService: TelegramAuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const initData = this.extractInitData(request);

    if (!initData) {
      throw new UnauthorizedException('No Telegram initData provided');
    }

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot token not configured');
    }

    try {
      await this.telegramAuthService.validateInitData(initData, botToken);
      const userData = await this.telegramAuthService.parseUserData(initData);
      request.telegramUser = userData;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid Telegram authentication');
    }
  }

  private extractInitData(request: any): string | null {
    // Try to get from body first (POST requests)
    if (request.body?.initData) {
      return request.body.initData;
    }

    // Try to get from query params (GET requests)
    if (request.query?.initData) {
      return request.query.initData;
    }

    // Try to get from headers
    if (request.headers?.['x-telegram-init-data']) {
      return request.headers['x-telegram-init-data'];
    }

    return null;
  }
}

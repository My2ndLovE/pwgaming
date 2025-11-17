import { Injectable, UnauthorizedException } from '@nestjs/common';
import { validate, parse } from '@telegram-apps/init-data-node';

export interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

@Injectable()
export class TelegramAuthService {
  private readonly MAX_AUTH_AGE = 86400; // 24 hours in seconds

  /**
   * Validates Telegram initData using @telegram-apps/init-data-node
   * @param initData - The init data string from Telegram Mini App
   * @param botToken - The bot token for validation
   * @returns true if valid
   * @throws UnauthorizedException if invalid
   */
  async validateInitData(initData: string, botToken: string): Promise<boolean> {
    try {
      // Validate the init data signature and structure
      validate(initData, botToken, { expiresIn: this.MAX_AUTH_AGE });
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new UnauthorizedException(`Telegram auth validation failed: ${error.message}`);
      }
      throw new UnauthorizedException('Telegram auth validation failed');
    }
  }

  /**
   * Parses user data from validated initData
   * @param initData - The init data string from Telegram Mini App
   * @returns Parsed user data
   * @throws Error if parsing fails
   */
  async parseUserData(initData: string): Promise<TelegramUserData> {
    try {
      // Parse the init data
      const parsed = parse(initData);

      // Extract user data
      if (!parsed.user) {
        throw new Error('No user data found in initData');
      }

      return {
        id: parsed.user.id,
        first_name: parsed.user.firstName as string | undefined,
        last_name: parsed.user.lastName as string | undefined,
        username: parsed.user.username as string | undefined,
        language_code: parsed.user.languageCode as string | undefined,
        photo_url: parsed.user.photoUrl as string | undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse Telegram user data: ${error.message}`);
      }
      throw new Error('Failed to parse Telegram user data');
    }
  }
}

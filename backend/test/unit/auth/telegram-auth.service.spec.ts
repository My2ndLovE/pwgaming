import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TelegramAuthService } from '../../../src/modules/auth/services/telegram-auth.service';
import * as telegramApps from '@telegram-apps/init-data-node';

// Mock the @telegram-apps/init-data-node module
jest.mock('@telegram-apps/init-data-node');

describe('TelegramAuthService', () => {
  let service: TelegramAuthService;
  const VALID_BOT_TOKEN = 'test-bot-token';
  const VALID_INIT_DATA =
    'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22John%22%2C%22last_name%22%3A%22Doe%22%2C%22username%22%3A%22john_doe%22%2C%22language_code%22%3A%22en%22%2C%22photo_url%22%3A%22https%3A%2F%2Ft.me%2Fi%2Fuserpic%2F320%2Fjohn_doe.jpg%22%7D&auth_date=1670000000&hash=abc123';

  const mockValidate = telegramApps.validate as jest.MockedFunction<typeof telegramApps.validate>;
  const mockParse = telegramApps.parse as jest.MockedFunction<typeof telegramApps.parse>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TelegramAuthService],
    }).compile();

    service = module.get<TelegramAuthService>(TelegramAuthService);
  });

  describe('validateInitData', () => {
    it('should return true for valid Telegram initData', async () => {
      mockValidate.mockImplementation(() => {
        // Valid data - no error thrown
      });

      const result = await service.validateInitData(VALID_INIT_DATA, VALID_BOT_TOKEN);
      expect(result).toBe(true);
      expect(mockValidate).toHaveBeenCalledWith(VALID_INIT_DATA, VALID_BOT_TOKEN, {
        expiresIn: 86400,
      });
    });

    it('should throw UnauthorizedException for invalid initData', async () => {
      mockValidate.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const invalidInitData = 'invalid_data';
      await expect(service.validateInitData(invalidInitData, VALID_BOT_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for tampered initData', async () => {
      mockValidate.mockImplementation(() => {
        throw new Error('Signature mismatch');
      });

      const tamperedData = VALID_INIT_DATA.replace('John', 'Hacker');
      await expect(service.validateInitData(tamperedData, VALID_BOT_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired initData (> 24 hours old)', async () => {
      mockValidate.mockImplementation(() => {
        throw new Error('Init data expired');
      });

      const oldTimestamp = Math.floor(Date.now() / 1000) - 86400 - 1;
      const expiredData = VALID_INIT_DATA.replace(/auth_date=\d+/, `auth_date=${oldTimestamp}`);
      await expect(service.validateInitData(expiredData, VALID_BOT_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for missing hash', async () => {
      mockValidate.mockImplementation(() => {
        throw new Error('Missing hash parameter');
      });

      const noHashData = VALID_INIT_DATA.replace(/&hash=\w+/, '');
      await expect(service.validateInitData(noHashData, VALID_BOT_TOKEN)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('parseUserData', () => {
    it('should correctly parse user data from valid initData', async () => {
      mockParse.mockReturnValue({
        user: {
          id: 279058397,
          firstName: 'John',
          lastName: 'Doe',
          username: 'john_doe',
          languageCode: 'en',
          photoUrl: 'https://t.me/i/userpic/320/john_doe.jpg',
        },
      } as any);

      const userData = await service.parseUserData(VALID_INIT_DATA);

      expect(userData).toEqual({
        id: 279058397,
        first_name: 'John',
        last_name: 'Doe',
        username: 'john_doe',
        language_code: 'en',
        photo_url: expect.stringContaining('john_doe.jpg'),
      });
    });

    it('should handle user data without optional fields', async () => {
      mockParse.mockReturnValue({
        user: {
          id: 123456,
          firstName: 'Jane',
        },
      } as any);

      const minimalUserData =
        'user=%7B%22id%22%3A123456%2C%22first_name%22%3A%22Jane%22%7D&auth_date=1670000000&hash=abc123';
      const userData = await service.parseUserData(minimalUserData);

      expect(userData).toEqual({
        id: 123456,
        first_name: 'Jane',
      });
      expect(userData.last_name).toBeUndefined();
      expect(userData.username).toBeUndefined();
    });

    it('should throw error for initData without user field', async () => {
      mockParse.mockReturnValue({} as any);

      const noUserData = 'auth_date=1670000000&hash=abc123';
      await expect(service.parseUserData(noUserData)).rejects.toThrow();
    });

    it('should throw error for invalid JSON in user field', async () => {
      mockParse.mockImplementation(() => {
        throw new Error('Invalid user data format');
      });

      const invalidJsonData = 'user=invalid_json&auth_date=1670000000&hash=abc123';
      await expect(service.parseUserData(invalidJsonData)).rejects.toThrow();
    });
  });
});

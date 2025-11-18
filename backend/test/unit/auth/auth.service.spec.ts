import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthService,
  TelegramUser,
} from '../../../src/modules/auth/services/auth.service';
import {
  User,
  UserRole,
  UserStatus,
} from '../../../src/modules/auth/entities/user.entity';
import { TelegramAuthService } from '../../../src/modules/auth/services/telegram-auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    telegramId: 279058397,
    username: 'john_doe',
    avatarUrl: 'https://t.me/i/userpic/320/john_doe.jpg',
    balance: 1000,
    role: UserRole.PLAYER,
    status: UserStatus.ACTIVE,
    suspensionReason: null,
    lastLogin: new Date('2024-01-01T00:00:00Z'),
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    validateBalance: jest.fn(),
    validateStatusTransition: jest.fn(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockTelegramAuthService = {
      validateAuthData: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TelegramAuthService,
          useValue: mockTelegramAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreateUser', () => {
    const telegramUser: TelegramUser = {
      id: 279058397,
      first_name: 'John',
      last_name: 'Doe',
      username: 'john_doe',
      photo_url: 'https://t.me/i/userpic/320/john_doe.jpg',
    };

    it('should create a new user if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, id: undefined as any };
      userRepository.create.mockReturnValue(newUser as User);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.findOrCreateUser(telegramUser);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId: telegramUser.id },
      });
      expect(userRepository.create).toHaveBeenCalledWith({
        telegramId: telegramUser.id,
        username: telegramUser.username,
        avatarUrl: telegramUser.photo_url,
        balance: 0,
        role: UserRole.PLAYER,
        status: UserStatus.ACTIVE,
        lastLogin: expect.any(Date),
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return existing user and update lastLogin', async () => {
      const existingUser = { ...mockUser };
      userRepository.findOne.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(existingUser);

      const result = await service.findOrCreateUser(telegramUser);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId: telegramUser.id },
      });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: existingUser.id,
          lastLogin: expect.any(Date),
        }),
      );
      expect(result.id).toBe(existingUser.id);
    });

    it('should use default username if username not provided', async () => {
      const telegramUserNoUsername = { ...telegramUser, username: undefined };
      userRepository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, id: undefined as any };
      userRepository.create.mockReturnValue(newUser as User);
      userRepository.save.mockResolvedValue(mockUser);

      await service.findOrCreateUser(telegramUserNoUsername);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: `user_${telegramUser.id}`,
        }),
      );
    });

    it('should set avatarUrl to null if photo_url not provided', async () => {
      const telegramUserNoPhoto = { ...telegramUser, photo_url: undefined };
      userRepository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, id: undefined as any };
      userRepository.create.mockReturnValue(newUser as User);
      userRepository.save.mockResolvedValue(mockUser);

      await service.findOrCreateUser(telegramUserNoPhoto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: null,
        }),
      );
    });

    it('should initialize new user with zero balance', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, id: undefined as any };
      userRepository.create.mockReturnValue(newUser as User);
      userRepository.save.mockResolvedValue(mockUser);

      await service.findOrCreateUser(telegramUser);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 0,
        }),
      );
    });

    it('should initialize new user with PLAYER role', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, id: undefined as any };
      userRepository.create.mockReturnValue(newUser as User);
      userRepository.save.mockResolvedValue(mockUser);

      await service.findOrCreateUser(telegramUser);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.PLAYER,
        }),
      );
    });

    it('should initialize new user with ACTIVE status', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const newUser = { ...mockUser, id: undefined as any };
      userRepository.create.mockReturnValue(newUser as User);
      userRepository.save.mockResolvedValue(mockUser);

      await service.findOrCreateUser(telegramUser);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: UserStatus.ACTIVE,
        }),
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      jwtService.sign.mockReturnValue(expectedToken);

      const result = await service.generateToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        telegramId: mockUser.telegramId,
        role: mockUser.role,
      });
      expect(result).toBe(expectedToken);
    });

    it('should include user id as sub in JWT payload', async () => {
      jwtService.sign.mockReturnValue('token');

      await service.generateToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
        }),
      );
    });

    it('should include telegramId in JWT payload', async () => {
      jwtService.sign.mockReturnValue('token');

      await service.generateToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramId: mockUser.telegramId,
        }),
      );
    });

    it('should include role in JWT payload', async () => {
      jwtService.sign.mockReturnValue('token');

      await service.generateToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: mockUser.role,
        }),
      );
    });
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserById(mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});

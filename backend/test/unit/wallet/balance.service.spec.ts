import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BalanceService } from '../../../src/modules/wallet/services/balance.service';
import { User, UserRole, UserStatus } from '../../../src/modules/auth/entities/user.entity';

describe('BalanceService', () => {
  let service: BalanceService;
  let userRepository: jest.Mocked<Repository<User>>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    telegramId: 279058397,
    username: 'test_user',
    avatarUrl: null,
    balance: 1000,
    role: UserRole.PLAYER,
    status: UserStatus.ACTIVE,
    suspensionReason: null,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    validateBalance: jest.fn(),
    validateStatusTransition: jest.fn(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockQueryRunner = {
      manager: {
        getRepository: jest.fn(() => ({
          findOne: jest.fn(),
          save: jest.fn(),
        })),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
    userRepository = module.get(getRepositoryToken(User));
    queryRunner = mockQueryRunner as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBalance', () => {
    it('should return user balance', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserBalance(mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(result).toBe(1000);
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserBalance('non-existent')).rejects.toThrow(BadRequestException);
    });

    it('should return balance as number', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: '1500.50' as any });

      const result = await service.getUserBalance(mockUser.id);

      expect(typeof result).toBe('number');
      expect(result).toBe(1500.5);
    });

    it('should handle zero balance', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 0 });

      const result = await service.getUserBalance(mockUser.id);

      expect(result).toBe(0);
    });
  });

  describe('updateBalance', () => {
    it('should update user balance with positive amount', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });
      userRepository.save.mockResolvedValue({ ...mockUser, balance: 1150 });

      const result = await service.updateBalance(mockUser.id, 150);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        lock: { mode: 'pessimistic_write' },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 1150,
        }),
      );
      expect(result).toBe(1150);
    });

    it('should update user balance with negative amount', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });
      userRepository.save.mockResolvedValue({ ...mockUser, balance: 850 });

      const result = await service.updateBalance(mockUser.id, -150);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 850,
        }),
      );
      expect(result).toBe(850);
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 100 });

      await expect(service.updateBalance(mockUser.id, -200)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateBalance('non-existent', 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use pessimistic locking', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.updateBalance(mockUser.id, 100);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('should allow zero balance after deduction', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 100 });
      userRepository.save.mockResolvedValue({ ...mockUser, balance: 0 });

      const result = await service.updateBalance(mockUser.id, -100);

      expect(result).toBe(0);
    });

    it('should not allow negative balance', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 100 });

      await expect(service.updateBalance(mockUser.id, -100.01)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use query runner repository if provided', async () => {
      const mockQRRepository = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
      };

      queryRunner.manager.getRepository.mockReturnValue(mockQRRepository as any);

      await service.updateBalance(mockUser.id, 100, queryRunner);

      expect(queryRunner.manager.getRepository).toHaveBeenCalledWith(User);
      expect(mockQRRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        lock: { mode: 'pessimistic_write' },
      });
    });
  });

  describe('validateBalance', () => {
    it('should return true if user has sufficient balance', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });

      const result = await service.validateBalance(mockUser.id, 500);

      expect(result).toBe(true);
    });

    it('should return true if user has exactly required balance', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });

      const result = await service.validateBalance(mockUser.id, 1000);

      expect(result).toBe(true);
    });

    it('should return false if user has insufficient balance', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });

      const result = await service.validateBalance(mockUser.id, 1500);

      expect(result).toBe(false);
    });

    it('should return false if user has zero balance and amount required', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 0 });

      const result = await service.validateBalance(mockUser.id, 1);

      expect(result).toBe(false);
    });

    it('should return true if zero amount required', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });

      const result = await service.validateBalance(mockUser.id, 0);

      expect(result).toBe(true);
    });

    it('should handle decimal amounts correctly', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 100.5 });

      const result = await service.validateBalance(mockUser.id, 100.49);

      expect(result).toBe(true);
    });
  });

  describe('concurrency and atomicity', () => {
    it('should handle concurrent balance updates safely', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });
      userRepository.save.mockResolvedValue({ ...mockUser, balance: 1100 });

      // Simulate two concurrent update attempts
      const update1 = service.updateBalance(mockUser.id, 50);
      const update2 = service.updateBalance(mockUser.id, 50);

      await Promise.all([update1, update2]);

      // Both should use pessimistic locking
      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('should handle balance check before deduction', async () => {
      const user = { ...mockUser, balance: 1000 };
      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue({ ...user, balance: 500 });

      await service.updateBalance(mockUser.id, -500);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 500,
        }),
      );
    });

    it('should prevent race conditions with pessimistic locking', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.updateBalance(mockUser.id, 100);

      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });
  });
});

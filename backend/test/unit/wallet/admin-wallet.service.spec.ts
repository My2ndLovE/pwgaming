import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminWalletService } from '../../../src/modules/wallet/services/admin-wallet.service';
import { Transaction, TransactionType, TransactionStatus } from '../../../src/modules/wallet/entities/transaction.entity';
import { User } from '../../../src/modules/auth/entities/user.entity';

describe('AdminWalletService', () => {
  let service: AdminWalletService;
  let transactionRepository: Repository<Transaction>;
  let userRepository: Repository<User>;
  let configService: ConfigService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'WALLET_MODE') return 'internal';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminWalletService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AdminWalletService>(AdminWalletService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation to default
    jest.spyOn(configService, 'get').mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'WALLET_MODE') return 'internal';
      return defaultValue;
    });
  });

  describe('isInternalMode', () => {
    it('should return true when WALLET_MODE=internal', () => {
      expect(service.isInternalMode()).toBe(true);
    });

    it('should return false when WALLET_MODE=external', () => {
      jest.spyOn(configService, 'get').mockReturnValue('external');
      expect(service.isInternalMode()).toBe(false);
    });
  });

  describe('creditUser', () => {
    it('should credit user balance in internal mode', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      const user = { id: 'user1', balance: 1000 } as User;
      const transaction = {
        id: 'tx1',
        type: TransactionType.ADMIN_CREDIT,
        amount: 500,
        balanceBefore: 1000,
        balanceAfter: 1500,
        processedBy: 'admin1',
      } as Transaction;

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.create.mockReturnValue(transaction);
      mockQueryRunner.manager.save.mockResolvedValue(transaction);

      const result = await service.creditUser({
        userId: 'user1',
        amount: 500,
        reason: 'Promotional bonus',
        adminId: 'admin1',
      });

      expect(result.type).toBe(TransactionType.ADMIN_CREDIT);
      expect(result.amount).toBe(500);
      expect(result.processedBy).toBe('admin1');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should reject if user is not admin', async () => {
      const nonAdmin = { id: 'user1', role: 'player' } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(nonAdmin);

      await expect(
        service.creditUser({
          userId: 'user2',
          amount: 500,
          reason: 'Test',
          adminId: 'user1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if admin not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.creditUser({
          userId: 'user1',
          amount: 500,
          reason: 'Test',
          adminId: 'invalid',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject negative or zero amounts', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(admin);

      await expect(
        service.creditUser({
          userId: 'user1',
          amount: -100,
          reason: 'Test',
          adminId: 'admin1',
        }),
      ).rejects.toThrow('Credit amount must be positive');

      await expect(
        service.creditUser({
          userId: 'user1',
          amount: 0,
          reason: 'Test',
          adminId: 'admin1',
        }),
      ).rejects.toThrow('Credit amount must be positive');
    });

    it('should reject in external mode', async () => {
      jest.spyOn(configService, 'get').mockReturnValue('external');

      await expect(
        service.creditUser({
          userId: 'user1',
          amount: 500,
          reason: 'Test',
          adminId: 'admin1',
        }),
      ).rejects.toThrow('Direct credits only available in internal wallet mode');
    });

    it('should rollback transaction on error', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      const user = { id: 'user1', balance: 1000 } as User;

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.creditUser({
          userId: 'user1',
          amount: 500,
          reason: 'Test',
          adminId: 'admin1',
        }),
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('debitUser', () => {
    it('should debit user balance in internal mode', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      const user = { id: 'user1', balance: 1000 } as User;
      const transaction = {
        id: 'tx2',
        type: TransactionType.ADMIN_DEBIT,
        amount: 300,
        balanceBefore: 1000,
        balanceAfter: 700,
      } as Transaction;

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.create.mockReturnValue(transaction);
      mockQueryRunner.manager.save.mockResolvedValue(transaction);

      const result = await service.debitUser({
        userId: 'user1',
        amount: 300,
        reason: 'Penalty',
        adminId: 'admin1',
      });

      expect(result.type).toBe(TransactionType.ADMIN_DEBIT);
      expect(result.amount).toBe(300);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should reject if insufficient balance', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      const user = { id: 'user1', balance: 100 } as User;

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);

      await expect(
        service.debitUser({
          userId: 'user1',
          amount: 500,
          reason: 'Test',
          adminId: 'admin1',
        }),
      ).rejects.toThrow('Insufficient balance for debit');
    });

    it('should reject negative or zero amounts', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(admin);

      await expect(
        service.debitUser({
          userId: 'user1',
          amount: -100,
          reason: 'Test',
          adminId: 'admin1',
        }),
      ).rejects.toThrow('Debit amount must be positive');
    });

    it('should use pessimistic locking', async () => {
      const admin = { id: 'admin1', role: 'admin' } as User;
      const user = { id: 'user1', balance: 1000 } as User;

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);

      await service.debitUser({
        userId: 'user1',
        amount: 300,
        reason: 'Test',
        adminId: 'admin1',
      });

      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });
  });

  describe('getWalletModeStatus', () => {
    it('should return internal mode features', () => {
      const status = service.getWalletModeStatus();

      expect(status.mode).toBe('internal');
      expect(status.features).toContain('Admin can credit/debit user balances');
      expect(status.features.length).toBeGreaterThan(0);
    });

    it('should return external mode features', () => {
      jest.spyOn(configService, 'get').mockReturnValue('external');

      const status = service.getWalletModeStatus();

      expect(status.mode).toBe('external');
      expect(status.features).toContain('Payment gateway integration active');
    });
  });
});

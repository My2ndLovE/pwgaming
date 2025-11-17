import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TransactionService } from '../../../src/modules/wallet/services/transaction.service';
import { BalanceService } from '../../../src/modules/wallet/services/balance.service';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../../src/modules/wallet/entities/transaction.entity';
import { User, UserRole, UserStatus } from '../../../src/modules/auth/entities/user.entity';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepository: jest.Mocked<Repository<Transaction>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let balanceService: jest.Mocked<BalanceService>;
  let dataSource: jest.Mocked<DataSource>;
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

  const mockTransaction: Transaction = {
    id: 'txn-123',
    userId: mockUser.id,
    user: mockUser,
    type: TransactionType.DEPOSIT,
    amount: 100,
    balanceBefore: 1000,
    balanceAfter: 1100,
    status: TransactionStatus.PENDING,
    notes: 'Test transaction',
    referenceId: null,
    processedBy: null,
    processedAt: null,
    processor: null,
    isImmutable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    validateImmutability: jest.fn(),
    validateBalanceReconciliation: jest.fn(),
  };

  beforeEach(async () => {
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

    const mockTransactionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockBalanceService = {
      getUserBalance: jest.fn(),
      updateBalance: jest.fn(),
      validateBalance: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: BalanceService,
          useValue: mockBalanceService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get(getRepositoryToken(Transaction));
    userRepository = module.get(getRepositoryToken(User));
    balanceService = module.get(BalanceService);
    dataSource = module.get(DataSource);
    queryRunner = mockQueryRunner as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeposit', () => {
    it('should create a deposit transaction', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      transactionRepository.create.mockReturnValue(mockTransaction as any);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.createDeposit({
        userId: mockUser.id,
        amount: 100,
        notes: 'Test deposit',
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          type: TransactionType.DEPOSIT,
          amount: 100,
          status: TransactionStatus.PENDING,
          notes: 'Test deposit',
        }),
      );
      expect(transactionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createDeposit({
          userId: 'non-existent',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set transaction status to PENDING', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      transactionRepository.create.mockReturnValue(mockTransaction as any);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      await service.createDeposit({ userId: mockUser.id, amount: 100 });

      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TransactionStatus.PENDING,
        }),
      );
    });

    it('should set isImmutable to false for pending transaction', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      transactionRepository.create.mockReturnValue(mockTransaction as any);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      await service.createDeposit({ userId: mockUser.id, amount: 100 });

      expect(transactionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isImmutable: false,
        }),
      );
    });
  });

  describe('createWithdrawal', () => {
    it('should create a withdrawal transaction with balance deduction', async () => {
      balanceService.validateBalance.mockResolvedValue(true);
      queryRunner.manager.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });
      queryRunner.manager.create.mockReturnValue(mockTransaction as any);
      queryRunner.manager.save
        .mockResolvedValueOnce({ ...mockUser, balance: 900 })
        .mockResolvedValueOnce({
          ...mockTransaction,
          type: TransactionType.WITHDRAWAL,
          balanceBefore: 1000,
          balanceAfter: 900,
        });

      const result = await service.createWithdrawal({
        userId: mockUser.id,
        amount: 100,
        notes: 'Test withdrawal',
      });

      expect(balanceService.validateBalance).toHaveBeenCalledWith(mockUser.id, 100);
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          where: { id: mockUser.id },
          lock: { mode: 'pessimistic_write' },
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user has insufficient balance', async () => {
      balanceService.validateBalance.mockResolvedValue(false);

      await expect(
        service.createWithdrawal({
          userId: mockUser.id,
          amount: 2000,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(balanceService.validateBalance).toHaveBeenCalledWith(mockUser.id, 2000);
    });

    it('should rollback transaction on error', async () => {
      balanceService.validateBalance.mockResolvedValue(true);
      queryRunner.manager.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createWithdrawal({
          userId: mockUser.id,
          amount: 100,
        }),
      ).rejects.toThrow('Database error');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should use pessimistic locking for balance update', async () => {
      balanceService.validateBalance.mockResolvedValue(true);
      queryRunner.manager.findOne.mockResolvedValue({ ...mockUser, balance: 1000 });
      queryRunner.manager.create.mockReturnValue(mockTransaction as any);
      queryRunner.manager.save.mockResolvedValue(mockTransaction);

      await service.createWithdrawal({ userId: mockUser.id, amount: 100 });

      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('should throw BadRequestException if user not found during withdrawal', async () => {
      balanceService.validateBalance.mockResolvedValue(true);
      queryRunner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.createWithdrawal({
          userId: 'non-existent',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should deduct balance immediately for withdrawal', async () => {
      const user = { ...mockUser, balance: 1000 };
      balanceService.validateBalance.mockResolvedValue(true);
      queryRunner.manager.findOne.mockResolvedValue(user);
      queryRunner.manager.create.mockReturnValue(mockTransaction as any);
      queryRunner.manager.save.mockResolvedValue(mockTransaction);

      await service.createWithdrawal({ userId: mockUser.id, amount: 100 });

      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          balance: 900,
        }),
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      const transactions = [mockTransaction, { ...mockTransaction, id: 'txn-456' }];
      transactionRepository.findAndCount.mockResolvedValue([transactions as any, 2]);

      const result = await service.getTransactionHistory(mockUser.id, 1, 20);

      expect(transactionRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle pagination correctly', async () => {
      transactionRepository.findAndCount.mockResolvedValue([[mockTransaction] as any, 1]);

      await service.getTransactionHistory(mockUser.id, 2, 10);

      expect(transactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should order transactions by createdAt DESC', async () => {
      transactionRepository.findAndCount.mockResolvedValue([[mockTransaction] as any, 1]);

      await service.getTransactionHistory(mockUser.id);

      expect(transactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });

    it('should use default pagination values', async () => {
      transactionRepository.findAndCount.mockResolvedValue([[mockTransaction] as any, 1]);

      await service.getTransactionHistory(mockUser.id);

      expect(transactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', async () => {
      transactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById('txn-123');

      expect(transactionRepository.findOne).toHaveBeenCalledWith({ where: { id: 'txn-123' } });
      expect(result).toEqual(mockTransaction);
    });

    it('should return null if transaction not found', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

      const result = await service.getTransactionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getPendingWithdrawals', () => {
    it('should return all pending withdrawals ordered by creation date', async () => {
      const pendingTransactions = [
        { ...mockTransaction, type: TransactionType.WITHDRAWAL },
        { ...mockTransaction, id: 'txn-456', type: TransactionType.WITHDRAWAL },
      ];
      transactionRepository.find.mockResolvedValue(pendingTransactions as any);

      const result = await service.getPendingWithdrawals();

      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: {
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
        },
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no pending withdrawals', async () => {
      transactionRepository.find.mockResolvedValue([]);

      const result = await service.getPendingWithdrawals();

      expect(result).toEqual([]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { GameWalletService } from '../../../src/modules/wallet/services/game-wallet.service';
import { Transaction, TransactionType, TransactionStatus } from '../../../src/modules/wallet/entities/transaction.entity';
import { User } from '../../../src/modules/auth/entities/user.entity';

describe('GameWalletService', () => {
  let service: GameWalletService;
  let transactionRepository: Repository<Transaction>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

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
      getRepository: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameWalletService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<GameWalletService>(GameWalletService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBuyIn', () => {
    it('should validate buy-in within range (20-100 BB)', async () => {
      const user = { id: 'user1', balance: 5000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await service.validateBuyIn({
        userId: 'user1',
        roomId: 'room1',
        buyInAmount: 2000, // 20 BB at 100 BB
        bigBlind: 100,
      });

      expect(result.isValid).toBe(true);
      expect(result.minBuyIn).toBe(2000);
      expect(result.maxBuyIn).toBe(10000);
    });

    it('should reject buy-in below 20 BB', async () => {
      const user = { id: 'user1', balance: 5000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await service.validateBuyIn({
        userId: 'user1',
        roomId: 'room1',
        buyInAmount: 1500, // 15 BB at 100 BB
        bigBlind: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 20 big blinds');
    });

    it('should reject buy-in above 100 BB', async () => {
      const user = { id: 'user1', balance: 15000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await service.validateBuyIn({
        userId: 'user1',
        roomId: 'room1',
        buyInAmount: 12000, // 120 BB at 100 BB
        bigBlind: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot exceed 100 big blinds');
    });

    it('should reject buy-in with insufficient balance', async () => {
      const user = { id: 'user1', balance: 1000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await service.validateBuyIn({
        userId: 'user1',
        roomId: 'room1',
        buyInAmount: 2000,
        bigBlind: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('should reject if user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateBuyIn({
        userId: 'invalid',
        roomId: 'room1',
        buyInAmount: 2000,
        bigBlind: 100,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('User not found');
    });
  });

  describe('processBuyIn', () => {
    it('should process valid buy-in atomically', async () => {
      const user = { id: 'user1', balance: 5000 } as User;
      const transaction = {
        id: 'tx1',
        userId: 'user1',
        type: TransactionType.GAME_BUYIN,
        amount: 2000,
        balanceBefore: 5000,
        balanceAfter: 3000,
        status: TransactionStatus.COMPLETED,
      } as Transaction;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.create.mockReturnValue(transaction);
      mockQueryRunner.manager.save.mockResolvedValue(transaction);

      const result = await service.processBuyIn({
        userId: 'user1',
        roomId: 'room1',
        buyInAmount: 2000,
        bigBlind: 100,
      });

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result.type).toBe(TransactionType.GAME_BUYIN);
      expect(result.amount).toBe(2000);
    });

    it('should rollback on validation failure', async () => {
      const user = { id: 'user1', balance: 500 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await expect(
        service.processBuyIn({
          userId: 'user1',
          roomId: 'room1',
          buyInAmount: 2000,
          bigBlind: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback on database error', async () => {
      const user = { id: 'user1', balance: 5000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.processBuyIn({
          userId: 'user1',
          roomId: 'room1',
          buyInAmount: 2000,
          bigBlind: 100,
        }),
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should use pessimistic locking to prevent race conditions', async () => {
      const user = { id: 'user1', balance: 5000 } as User;
      const transaction = {
        id: 'tx1',
        type: TransactionType.GAME_BUYIN,
        amount: 2000,
      } as Transaction;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.create.mockReturnValue(transaction);
      mockQueryRunner.manager.save.mockResolvedValue(transaction);

      await service.processBuyIn({
        userId: 'user1',
        roomId: 'room1',
        buyInAmount: 2000,
        bigBlind: 100,
      });

      expect(mockQueryRunner.manager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });
  });

  describe('processCashOut', () => {
    it('should return chips to wallet', async () => {
      const user = { id: 'user1', balance: 3000 } as User;
      const transaction = {
        id: 'tx2',
        userId: 'user1',
        type: TransactionType.GAME_CASHOUT,
        amount: 1500,
        balanceBefore: 3000,
        balanceAfter: 4500,
      } as Transaction;

      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.create.mockReturnValue(transaction);
      mockQueryRunner.manager.save.mockResolvedValue(transaction);

      const result = await service.processCashOut({
        userId: 'user1',
        roomId: 'room1',
        chipStack: 1500,
      });

      expect(result.type).toBe(TransactionType.GAME_CASHOUT);
      expect(result.amount).toBe(1500);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should create zero-chip audit record when no chips remaining', async () => {
      const user = { id: 'user1', balance: 3000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue({
        amount: 0,
        type: TransactionType.GAME_CASHOUT,
      } as Transaction);

      const result = await service.processCashOut({
        userId: 'user1',
        roomId: 'room1',
        chipStack: 0,
      });

      expect(result.amount).toBe(0);
      expect(transactionRepository.save).toHaveBeenCalled();
    });

    it('should reject negative chip stack', async () => {
      await expect(
        service.processCashOut({
          userId: 'user1',
          roomId: 'room1',
          chipStack: -100,
        }),
      ).rejects.toThrow('Chip stack cannot be negative');
    });
  });

  describe('processRebuy', () => {
    it('should process rebuy with same validation as buy-in', async () => {
      const user = { id: 'user1', balance: 5000 } as User;
      const transaction = {
        id: 'tx3',
        type: TransactionType.GAME_REBUY,
        amount: 2000,
      } as Transaction;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      mockQueryRunner.manager.findOne.mockResolvedValue(user);
      mockQueryRunner.manager.create.mockReturnValue(transaction);
      mockQueryRunner.manager.save.mockResolvedValue(transaction);

      const result = await service.processRebuy({
        userId: 'user1',
        roomId: 'room1',
        rebuyAmount: 2000,
        bigBlind: 100,
      });

      expect(result.type).toBe(TransactionType.GAME_REBUY);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should enforce 20-100 BB range for rebuy', async () => {
      const user = { id: 'user1', balance: 1000 } as User;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      await expect(
        service.processRebuy({
          userId: 'user1',
          roomId: 'room1',
          rebuyAmount: 1500, // 15 BB
          bigBlind: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBuyInLimits', () => {
    it('should return correct min/max for given big blind', () => {
      const limits = service.getBuyInLimits(100);

      expect(limits.min).toBe(2000); // 20 * 100
      expect(limits.max).toBe(10000); // 100 * 100
    });

    it('should handle different blind levels', () => {
      expect(service.getBuyInLimits(50)).toEqual({ min: 1000, max: 5000 });
      expect(service.getBuyInLimits(200)).toEqual({ min: 4000, max: 20000 });
    });
  });
});

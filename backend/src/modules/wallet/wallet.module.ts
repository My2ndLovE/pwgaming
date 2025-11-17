import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Transaction } from './entities/transaction.entity';
import { User } from '../auth/entities/user.entity';
import { TransactionService } from './services/transaction.service';
import { BalanceService } from './services/balance.service';
import { GameWalletService } from './services/game-wallet.service';
import { AdminWalletService } from './services/admin-wallet.service';
import { WalletController } from './controllers/wallet.controller';
import { AdminWalletController } from './controllers/admin-wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User]),
    ConfigModule,
  ],
  controllers: [WalletController, AdminWalletController],
  providers: [
    TransactionService,
    BalanceService,
    GameWalletService,
    AdminWalletService,
  ],
  exports: [
    TransactionService,
    BalanceService,
    GameWalletService,
    AdminWalletService,
  ],
})
export class WalletModule {}

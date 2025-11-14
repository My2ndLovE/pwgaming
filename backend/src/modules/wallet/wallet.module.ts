import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { User } from '../auth/entities/user.entity';
import { TransactionService } from './services/transaction.service';
import { BalanceService } from './services/balance.service';
import { WalletController } from './controllers/wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User])],
  controllers: [WalletController],
  providers: [TransactionService, BalanceService],
  exports: [TransactionService, BalanceService],
})
export class WalletModule {}

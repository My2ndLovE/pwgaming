import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../wallet/entities/transaction.entity';
import { WithdrawalManagementService } from './services/withdrawal-management.service';
import { WithdrawalController } from './controllers/withdrawal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  controllers: [WithdrawalController],
  providers: [WithdrawalManagementService],
  exports: [WithdrawalManagementService],
})
export class AdminModule {}

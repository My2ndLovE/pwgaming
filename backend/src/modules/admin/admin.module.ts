import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../wallet/entities/transaction.entity';
import { GameHand } from '../game/entities/game-hand.entity';
import { PlayerSeat } from '../game/entities/player-seat.entity';
import { BettingAction } from '../game/entities/betting-action.entity';
import { WithdrawalManagementService } from './services/withdrawal-management.service';
import { HandReplayService } from './services/hand-replay.service';
import { WithdrawalController } from './controllers/withdrawal.controller';
import { HandReplayController } from './controllers/hand-replay.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      GameHand,
      PlayerSeat,
      BettingAction,
    ]),
    GameModule,
  ],
  controllers: [WithdrawalController, HandReplayController],
  providers: [WithdrawalManagementService, HandReplayService],
  exports: [WithdrawalManagementService, HandReplayService],
})
export class AdminModule {}

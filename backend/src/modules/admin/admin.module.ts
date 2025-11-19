import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../wallet/entities/transaction.entity';
import { GameHand } from '../game/entities/game-hand.entity';
import { PlayerSeat } from '../game/entities/player-seat.entity';
import { BettingAction } from '../game/entities/betting-action.entity';
import { Room } from '../room/entities/room.entity';
import { WithdrawalManagementService } from './services/withdrawal-management.service';
import { HandReplayService } from './services/hand-replay.service';
import { GameAdminService } from './services/game-admin.service';
import { WithdrawalController } from './controllers/withdrawal.controller';
import { HandReplayController } from './controllers/hand-replay.controller';
import { GameAdminController } from './controllers/game-admin.controller';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      GameHand,
      PlayerSeat,
      BettingAction,
      Room,
    ]),
    forwardRef(() => GameModule),
  ],
  controllers: [
    WithdrawalController,
    HandReplayController,
    GameAdminController,
  ],
  providers: [
    WithdrawalManagementService,
    HandReplayService,
    GameAdminService,
  ],
  exports: [
    WithdrawalManagementService,
    HandReplayService,
    GameAdminService,
  ],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHand } from './entities/game-hand.entity';
import { PlayerSeat } from './entities/player-seat.entity';
import { BettingAction } from './entities/betting-action.entity';
import { RakeHistory } from './entities/rake-history.entity';
import { Room } from '../room/entities/room.entity';
import { DeckService } from './services/deck.service';
import { HandEvaluatorService } from './services/hand-evaluator.service';
import { PotService } from './services/pot.service';
import { BettingService } from './services/betting.service';
import { GameStateMachine } from './services/game-state-machine.service';
import { GameEngine } from './services/game-engine.service';
import { TimeoutService } from './services/timeout.service';
import { BlindService } from './services/blind.service';
import { RakeService } from './services/rake.service';
import { ShowdownService } from './services/showdown.service';
import { GameGateway } from './gateways/game.gateway';
import { AuthModule } from '../auth/auth.module';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHand, PlayerSeat, BettingAction, RakeHistory, Room]),
    AuthModule,
    RoomModule,
  ],
  providers: [
    DeckService,
    HandEvaluatorService,
    PotService,
    BettingService,
    GameStateMachine,
    GameEngine,
    TimeoutService,
    BlindService,
    RakeService,
    ShowdownService,
    GameGateway,
  ],
  exports: [
    DeckService,
    HandEvaluatorService,
    PotService,
    BettingService,
    GameStateMachine,
    GameEngine,
    TimeoutService,
    BlindService,
    RakeService,
    ShowdownService,
  ],
})
export class GameModule {}

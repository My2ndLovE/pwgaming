import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHand } from './entities/game-hand.entity';
import { PlayerSeat } from './entities/player-seat.entity';
import { BettingAction } from './entities/betting-action.entity';
import { Room } from '../room/entities/room.entity';
import { DeckService } from './services/deck.service';
import { HandEvaluatorService } from './services/hand-evaluator.service';
import { PotService } from './services/pot.service';
import { GameGateway } from './gateways/game.gateway';
import { AuthModule } from '../auth/auth.module';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHand, PlayerSeat, BettingAction, Room]),
    AuthModule,
    RoomModule,
  ],
  providers: [DeckService, HandEvaluatorService, PotService, GameGateway],
  exports: [DeckService, HandEvaluatorService, PotService],
})
export class GameModule {}

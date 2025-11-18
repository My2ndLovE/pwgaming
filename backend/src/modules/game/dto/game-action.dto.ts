import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  Min,
  IsOptional,
} from 'class-validator';
import { ActionType } from '../entities/betting-action.entity';

export class GameActionDto {
  @IsNotEmpty()
  @IsString()
  roomId!: string;

  @IsNotEmpty()
  @IsEnum(ActionType)
  action!: ActionType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class JoinGameDto {
  @IsNotEmpty()
  @IsString()
  roomId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  buyIn!: number;
}

export class RebuyDto {
  @IsNotEmpty()
  @IsString()
  roomId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;
}

export class LeaveGameDto {
  @IsNotEmpty()
  @IsString()
  roomId!: string;
}

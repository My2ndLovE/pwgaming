import { IsString, IsNumber, IsEnum, IsUUID, Min, Max, IsOptional } from 'class-validator';
import { ActionType } from '../entities/betting-action.entity';

/**
 * DTO for joining a game room
 */
export class JoinGameDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid room ID format' })
  roomId!: string;

  @IsNumber()
  @Min(0, { message: 'Buy-in must be a positive number' })
  @Max(1000000, { message: 'Buy-in exceeds maximum allowed amount' })
  buyIn!: number;
}

/**
 * DTO for performing a game action (bet, raise, fold, etc.)
 */
export class GameActionDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid room ID format' })
  roomId!: string;

  @IsEnum(ActionType, { message: 'Invalid action type' })
  action!: ActionType;

  @IsNumber()
  @Min(0, { message: 'Amount must be a positive number' })
  @Max(1000000, { message: 'Amount exceeds maximum allowed' })
  amount!: number;
}

/**
 * DTO for leaving a game room
 */
export class LeaveGameDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid room ID format' })
  roomId!: string;
}

/**
 * DTO for rebuying into a game
 */
export class RebuyDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid room ID format' })
  roomId!: string;

  @IsNumber()
  @Min(0, { message: 'Rebuy amount must be a positive number' })
  @Max(1000000, { message: 'Rebuy amount exceeds maximum allowed' })
  amount!: number;
}

/**
 * DTO for requesting game state
 */
export class GetGameStateDto {
  @IsString()
  @IsUUID('4', { message: 'Invalid room ID format' })
  roomId!: string;
}

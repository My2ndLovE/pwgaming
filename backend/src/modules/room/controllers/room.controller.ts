import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RoomService } from '../services/room.service';
import { RoomStatus } from '../entities/room.entity';
import {
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0.01)
  smallBlind!: number;

  @IsNumber()
  @Min(0.02)
  bigBlind!: number;

  @IsNumber()
  @Min(1)
  minBuyIn!: number;

  @IsNumber()
  @Min(1)
  maxBuyIn!: number;

  @IsNumber()
  @Min(2)
  @Max(9)
  maxPlayers!: number;
}

export class JoinRoomDto {
  @IsNumber()
  @Min(1)
  buyInAmount!: number;
}

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async listRooms(@Query('status') status?: RoomStatus) {
    const rooms = await this.roomService.listRooms(status);
    return {
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        smallBlind: r.smallBlind,
        bigBlind: r.bigBlind,
        minBuyIn: r.minBuyIn,
        maxBuyIn: r.maxBuyIn,
        maxPlayers: r.maxPlayers,
        currentPlayers: r.currentPlayers,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  @Get(':id')
  async getRoom(@Param('id') id: string) {
    const room = await this.roomService.getRoomById(id);
    if (!room) {
      throw new Error('Room not found');
    }
    return { room };
  }

  @Post()
  async createRoom(@Request() req: any, @Body() dto: CreateRoomDto) {
    const room = await this.roomService.createRoom({
      ...dto,
      createdBy: req.user.id,
    });

    return {
      message: 'Room created successfully',
      room: {
        id: room.id,
        name: room.name,
        status: room.status,
      },
    };
  }

  @Post(':id/join')
  async joinRoom(
    @Param('id') roomId: string,
    @Request() req: any,
    @Body() dto: JoinRoomDto,
  ) {
    const result = await this.roomService.joinRoom({
      roomId,
      userId: req.user.id,
      buyInAmount: dto.buyInAmount,
    });

    return result;
  }
}

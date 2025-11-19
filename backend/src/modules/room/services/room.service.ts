import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from '../entities/room.entity';
import { BalanceService } from '../../wallet/services/balance.service';

export interface CreateRoomDto {
  name: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  createdBy: string;
}

export interface JoinRoomDto {
  roomId: string;
  userId: string;
  buyInAmount: number;
}

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly balanceService: BalanceService,
  ) {}

  async createRoom(dto: CreateRoomDto): Promise<Room> {
    // Validate blinds and buy-ins
    if (dto.bigBlind < dto.smallBlind) {
      throw new BadRequestException('Big blind must be >= small blind');
    }

    if (dto.maxBuyIn < dto.minBuyIn) {
      throw new BadRequestException('Max buy-in must be >= min buy-in');
    }

    const room = this.roomRepository.create({
      name: dto.name,
      smallBlind: dto.smallBlind,
      bigBlind: dto.bigBlind,
      minBuyIn: dto.minBuyIn,
      maxBuyIn: dto.maxBuyIn,
      maxPlayers: dto.maxPlayers,
      currentPlayers: 0,
      status: RoomStatus.WAITING,
      createdBy: dto.createdBy,
    });

    return await this.roomRepository.save(room);
  }

  async listRooms(status?: RoomStatus): Promise<Room[]> {
    const where = status ? { status } : {};
    return await this.roomRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getRoomById(id: string): Promise<Room | null> {
    return await this.roomRepository.findOne({ where: { id } });
  }

  async joinRoom(
    dto: JoinRoomDto,
  ): Promise<{ success: boolean; message: string }> {
    const room = await this.roomRepository.findOne({
      where: { id: dto.roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (
      room.status !== RoomStatus.WAITING &&
      room.status !== RoomStatus.ACTIVE
    ) {
      throw new BadRequestException('Room is not available');
    }

    if (room.currentPlayers >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }

    // Validate buy-in amount
    if (dto.buyInAmount < room.minBuyIn || dto.buyInAmount > room.maxBuyIn) {
      throw new BadRequestException(
        `Buy-in must be between ${room.minBuyIn} and ${room.maxBuyIn}`,
      );
    }

    // Validate user balance
    const hasBalance = await this.balanceService.validateBalance(
      dto.userId,
      dto.buyInAmount,
    );

    if (!hasBalance) {
      throw new BadRequestException('Insufficient balance for buy-in');
    }

    // PlayerSeat creation is now handled by GameGateway when player actually joins
    // This method just validates the join is possible
    room.currentPlayers += 1;

    if (room.currentPlayers >= 2 && room.status === RoomStatus.WAITING) {
      room.status = RoomStatus.ACTIVE;
    }

    await this.roomRepository.save(room);

    return {
      success: true,
      message: 'Successfully joined room',
    };
  }

  /**
   * Increment hand count for a room
   * Called when a new hand starts
   */
  async incrementHandCount(roomId: string): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    room.handCount = (room.handCount || 0) + 1;
    await this.roomRepository.save(room);
  }
}

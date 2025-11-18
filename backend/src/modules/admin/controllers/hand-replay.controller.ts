import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { HandReplayService } from '../services/hand-replay.service';

@ApiTags('admin/hand-replay')
@Controller('admin/hand-replay')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class HandReplayController {
  constructor(private readonly handReplayService: HandReplayService) {}

  @Get(':handId')
  @ApiOperation({ summary: 'Get complete hand replay data' })
  @ApiResponse({ status: 200, description: 'Hand replay data retrieved' })
  @ApiResponse({ status: 404, description: 'Hand not found' })
  async getHandReplay(@Param('handId') handId: string) {
    return this.handReplayService.getHandReplay(handId);
  }

  @Get(':handId/deck')
  @ApiOperation({ summary: 'Reconstruct exact deck shuffle using seed' })
  @ApiResponse({ status: 200, description: 'Deck reconstructed successfully' })
  @ApiResponse({ status: 404, description: 'Hand not found' })
  @ApiResponse({ status: 400, description: 'No shuffle seed available' })
  async reconstructDeck(@Param('handId') handId: string) {
    const deck = await this.handReplayService.reconstructDeck(handId);
    return {
      handId,
      deck,
      totalCards: deck.length,
    };
  }

  @Get(':handId/verify')
  @ApiOperation({ summary: 'Verify hand replay accuracy' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyReplay(@Param('handId') handId: string) {
    const isAccurate =
      await this.handReplayService.verifyReplayAccuracy(handId);
    return {
      handId,
      isAccurate,
      message: isAccurate
        ? 'Replay is accurate - all cards match'
        : 'Replay verification failed or seed not available',
    };
  }
}

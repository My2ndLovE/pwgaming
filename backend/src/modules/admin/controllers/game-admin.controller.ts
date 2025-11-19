import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { GameAdminService } from '../services/game-admin.service';

@Controller('admin/games')
@UseGuards(AdminGuard)
export class GameAdminController {
  constructor(private readonly gameAdminService: GameAdminService) {}

  @Get('live')
  async getLiveGames() {
    return await this.gameAdminService.getLiveGames();
  }

  @Post(':roomId/pause')
  async pauseGame(@Param('roomId') roomId: string) {
    return await this.gameAdminService.pauseGame(roomId);
  }

  @Post(':roomId/resume')
  async resumeGame(@Param('roomId') roomId: string) {
    return await this.gameAdminService.resumeGame(roomId);
  }

  @Post(':roomId/cancel')
  async cancelHand(
    @Param('roomId') roomId: string,
    @Body() body: { reason: string },
  ) {
    return await this.gameAdminService.cancelHand(roomId, body.reason);
  }

  @Get(':roomId/history')
  async getHandHistory(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.gameAdminService.getHandHistory(roomId, limit);
  }

  @Get('suspicious-activity')
  async getSuspiciousActivity() {
    return await this.gameAdminService.getSuspiciousActivity();
  }
}

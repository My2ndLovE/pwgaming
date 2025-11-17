import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/guards/admin.guard';

@Controller('admin/games')
@UseGuards(AdminGuard)
export class GameAdminController {
  @Get('live')
  async getLiveGames() {
    return {
      games: [],
      totalPlayers: 0,
      activeTables: 0,
    };
  }

  @Post(':roomId/pause')
  async pauseGame(@Param('roomId') roomId: string) {
    return { success: true, message: 'Game paused' };
  }

  @Post(':roomId/resume')
  async resumeGame(@Param('roomId') roomId: string) {
    return { success: true, message: 'Game resumed' };
  }

  @Post(':roomId/cancel')
  async cancelHand(
    @Param('roomId') roomId: string,
    @Body() body: { reason: string },
  ) {
    return { success: true, message: 'Hand cancelled, all bets refunded' };
  }

  @Get(':roomId/history')
  async getHandHistory(@Param('roomId') roomId: string) {
    return { hands: [] };
  }

  @Get('suspicious-activity')
  async getSuspiciousActivity() {
    return { flaggedUsers: [], botDetections: [], multiAccounts: [] };
  }
}

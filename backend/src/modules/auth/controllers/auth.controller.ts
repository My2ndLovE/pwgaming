import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export class TelegramAuthDto {
  initData!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async authenticateTelegram(@Body() dto: TelegramAuthDto) {
    const user = await this.authService.validateTelegramAuth(dto.initData);
    const token = await this.authService.generateToken(user);
    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
        role: user.role,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return {
      id: req.user.id,
      username: req.user.username,
      avatarUrl: req.user.avatarUrl,
      balance: req.user.balance,
      role: req.user.role,
      status: req.user.status,
    };
  }
}

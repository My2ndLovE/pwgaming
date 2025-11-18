import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminWalletService } from '../services/admin-wallet.service';

class AdminCreditDto {
  amount!: number;
  reason!: string;
}

class AdminDebitDto {
  amount!: number;
  reason!: string;
}

/**
 * AdminWalletController handles manual wallet operations
 * Requires admin role for all endpoints
 */
@Controller('admin/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminWalletController {
  constructor(private readonly adminWalletService: AdminWalletService) {}

  /**
   * Manually credit user balance
   * POST /admin/wallet/credit/:userId
   *
   * Use cases:
   * - Promotional bonuses
   * - Payment gateway downtime recovery
   * - Bug compensation
   * - VIP arrangements
   *
   * @param userId - Target user ID
   * @param dto - Amount and reason
   * @param req - Admin user from JWT
   */
  @Post('credit/:userId')
  async creditUser(
    @Param('userId') userId: string,
    @Body() dto: AdminCreditDto,
    @Request() req: any,
  ) {
    const adminId = req.user.userId;

    const transaction = await this.adminWalletService.creditUser({
      userId,
      amount: dto.amount,
      reason: dto.reason,
      adminId,
    });

    return {
      success: true,
      transaction: {
        id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        processedBy: transaction.processedBy,
        processedAt: transaction.processedAt,
        notes: transaction.notes,
      },
    };
  }

  /**
   * Manually debit user balance
   * POST /admin/wallet/debit/:userId
   *
   * Use cases:
   * - Penalties
   * - Disputed transaction reversals
   * - Balance corrections
   *
   * @param userId - Target user ID
   * @param dto - Amount and reason
   * @param req - Admin user from JWT
   */
  @Post('debit/:userId')
  async debitUser(
    @Param('userId') userId: string,
    @Body() dto: AdminDebitDto,
    @Request() req: any,
  ) {
    const adminId = req.user.userId;

    const transaction = await this.adminWalletService.debitUser({
      userId,
      amount: dto.amount,
      reason: dto.reason,
      adminId,
    });

    return {
      success: true,
      transaction: {
        id: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        processedBy: transaction.processedBy,
        processedAt: transaction.processedAt,
        notes: transaction.notes,
      },
    };
  }

  /**
   * Get wallet mode status
   * GET /admin/wallet/mode
   *
   * Returns current wallet mode and available features
   */
  @Get('mode')
  getWalletMode() {
    return this.adminWalletService.getWalletModeStatus();
  }
}

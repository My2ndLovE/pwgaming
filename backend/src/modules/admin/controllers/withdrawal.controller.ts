import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../guards/admin-role.guard';
import { WithdrawalManagementService } from '../services/withdrawal-management.service';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectWithdrawalDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class WithdrawalController {
  constructor(
    private readonly withdrawalManagementService: WithdrawalManagementService,
  ) {}

  @Get()
  async getPendingWithdrawals() {
    const withdrawals =
      await this.withdrawalManagementService.getPendingWithdrawals();
    return {
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        userId: w.userId,
        username: (w as any).user?.username,
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt,
        notes: w.notes,
      })),
    };
  }

  @Post(':id/approve')
  async approveWithdrawal(@Param('id') id: string, @Request() req: any) {
    const transaction =
      await this.withdrawalManagementService.approveWithdrawal(
        id,
        req.user.id,
        req.ip,
      );

    return {
      message: 'Withdrawal approved successfully',
      transaction: {
        id: transaction.id,
        status: transaction.status,
        processedAt: transaction.processedAt,
      },
    };
  }

  @Post(':id/reject')
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
    @Request() req: any,
  ) {
    const transaction = await this.withdrawalManagementService.rejectWithdrawal(
      id,
      req.user.id,
      dto.reason,
      req.ip,
    );

    return {
      message: 'Withdrawal rejected successfully',
      transaction: {
        id: transaction.id,
        status: transaction.status,
        processedAt: transaction.processedAt,
      },
    };
  }
}

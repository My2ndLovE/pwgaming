import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';
import { BalanceService } from '../services/balance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDepositDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWithdrawalDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly balanceService: BalanceService,
  ) {}

  @Get('balance')
  async getBalance(@Request() req: any) {
    const balance = await this.balanceService.getUserBalance(req.user.id);
    return { balance };
  }

  @Post('deposit')
  async createDeposit(@Request() req: any, @Body() dto: CreateDepositDto) {
    const transaction = await this.transactionService.createDeposit({
      userId: req.user.id,
      amount: dto.amount,
      notes: dto.notes,
    });

    return {
      message: 'Deposit request created. Awaiting admin approval.',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    };
  }

  @Post('withdraw')
  async createWithdrawal(@Request() req: any, @Body() dto: CreateWithdrawalDto) {
    const transaction = await this.transactionService.createWithdrawal({
      userId: req.user.id,
      amount: dto.amount,
      notes: dto.notes,
    });

    return {
      message: 'Withdrawal request created. Awaiting admin approval.',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    };
  }

  @Get('transactions')
  async getTransactions(
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const result = await this.transactionService.getTransactionHistory(
      req.user.id,
      page,
      limit,
    );

    return {
      transactions: result.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
        notes: t.notes,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}

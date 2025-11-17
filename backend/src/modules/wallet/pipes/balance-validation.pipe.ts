import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class BalanceValidationPipe implements PipeTransform {
  transform(value: any) {
    const amount = parseFloat(value);

    if (isNaN(amount)) {
      throw new BadRequestException('Amount must be a valid number');
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (amount > 1000000) {
      throw new BadRequestException('Amount exceeds maximum allowed limit');
    }

    // Validate decimal places (max 2 decimal places)
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new BadRequestException('Amount can have at most 2 decimal places');
    }

    return amount;
  }
}

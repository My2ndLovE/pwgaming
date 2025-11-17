import { Injectable } from '@nestjs/common';

export interface RakeConfiguration {
  rakePercentage: number; // 5% = 5
  rakeCap: number; // Maximum rake amount (e.g., $3)
  minimumPotForRake: number; // Minimum pot to charge rake (e.g., $10)
}

export interface RakeDetails {
  originalPotAmount: number;
  rakeAmount: number;
  potAfterRake: number;
  rakePercentage: number;
  wasRakeApplied: boolean;
}

@Injectable()
export class RakeService {
  private readonly config: RakeConfiguration = {
    rakePercentage: 5, // 5%
    rakeCap: 3, // $3 maximum
    minimumPotForRake: 10, // $10 minimum pot
  };

  /**
   * Calculates rake for a given pot amount
   * @param potAmount - The pot amount to calculate rake for
   * @returns The rake amount to be deducted
   */
  calculateRake(potAmount: number): number {
    // No rake on negative or zero pots
    if (potAmount <= 0) {
      return 0;
    }

    // No rake on pots less than minimum
    if (potAmount < this.config.minimumPotForRake) {
      return 0;
    }

    // Calculate 5% rake
    const calculatedRake = potAmount * (this.config.rakePercentage / 100);

    // Cap at maximum rake
    return Math.min(calculatedRake, this.config.rakeCap);
  }

  /**
   * Calculates rake with detailed breakdown
   * @param potAmount - The pot amount
   * @returns Detailed rake calculation
   */
  calculateRakeWithDetails(potAmount: number): RakeDetails {
    const rakeAmount = this.calculateRake(potAmount);
    const potAfterRake = potAmount - rakeAmount;
    const wasRakeApplied = rakeAmount > 0;

    return {
      originalPotAmount: potAmount,
      rakeAmount,
      potAfterRake,
      rakePercentage: this.config.rakePercentage,
      wasRakeApplied,
    };
  }

  /**
   * Deducts rake from pot and returns remaining amount
   * @param potAmount - The pot amount
   * @returns Pot amount after rake deduction
   */
  deductRakeFromPot(potAmount: number): number {
    const rake = this.calculateRake(potAmount);
    return potAmount - rake;
  }

  /**
   * Gets the current rake configuration
   * @returns Rake configuration
   */
  getRakeConfiguration(): RakeConfiguration {
    return { ...this.config };
  }

  /**
   * Checks if rake is applicable for a given pot amount
   * @param potAmount - The pot amount
   * @returns True if rake should be charged
   */
  isRakeApplicable(potAmount: number): boolean {
    return potAmount >= this.config.minimumPotForRake;
  }
}

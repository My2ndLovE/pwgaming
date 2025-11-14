import { Injectable } from '@nestjs/common';

export interface PlayerContribution {
  userId: string;
  amount: number;
}

export interface Pot {
  amount: number;
  eligiblePlayers: string[];
}

@Injectable()
export class PotService {
  calculatePots(contributions: PlayerContribution[]): Pot[] {
    if (contributions.length === 0) return [];

    // Sort by contribution amount
    const sorted = [...contributions].sort((a, b) => a.amount - b.amount);
    const pots: Pot[] = [];
    let remainingPlayers = sorted.map((c) => c.userId);

    for (let i = 0; i < sorted.length; i++) {
      const currentLevel = sorted[i].amount;
      const previousLevel = i > 0 ? sorted[i - 1].amount : 0;
      const contributionDiff = currentLevel - previousLevel;

      if (contributionDiff > 0) {
        const potAmount = contributionDiff * remainingPlayers.length;
        pots.push({
          amount: potAmount,
          eligiblePlayers: [...remainingPlayers],
        });
      }

      // Remove this player from eligible players for next pot (they're all-in)
      remainingPlayers = remainingPlayers.filter((p) => p !== sorted[i].userId);
    }

    return pots;
  }

  distributePots(
    pots: Pot[],
    winners: Array<{ userId: string; potIndex: number }>,
  ): Map<string, number> {
    const winnings = new Map<string, number>();

    for (const winner of winners) {
      const pot = pots[winner.potIndex];
      if (!pot) continue;

      // Find all winners for this pot
      const potWinners = winners.filter((w) => w.potIndex === winner.potIndex);
      const share = pot.amount / potWinners.length;

      const currentWinnings = winnings.get(winner.userId) || 0;
      winnings.set(winner.userId, currentWinnings + share);
    }

    return winnings;
  }
}

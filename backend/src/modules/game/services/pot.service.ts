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

  /**
   * Distributes pot with odd chip rule (closest to button clockwise gets extra chip)
   * @param potAmount - Total pot amount
   * @param winners - Winners with position information
   * @param dealerPosition - The dealer button position
   * @returns Distribution map with odd chip awarded correctly
   */
  distributeOddChip(
    potAmount: number,
    winners: Array<{ userId: string; position: number }>,
    dealerPosition: number
  ): Map<string, number> {
    const distribution = new Map<string, number>();

    if (winners.length === 0) {
      return distribution;
    }

    // Calculate base share for each winner
    const baseShare = Math.floor(potAmount / winners.length);
    const oddChips = potAmount % winners.length;

    // Sort winners clockwise from dealer
    const sortedWinners = this.sortWinnersClockwiseFromDealer(winners, dealerPosition);

    // Distribute base share to all winners
    sortedWinners.forEach(winner => {
      distribution.set(winner.userId, baseShare);
    });

    // Award odd chips to first N winners clockwise from button
    for (let i = 0; i < oddChips; i++) {
      const winner = sortedWinners[i];
      const currentAmount = distribution.get(winner.userId) || 0;
      distribution.set(winner.userId, currentAmount + 1);
    }

    return distribution;
  }

  /**
   * Sorts winners clockwise from dealer position
   */
  private sortWinnersClockwiseFromDealer(
    winners: Array<{ userId: string; position: number }>,
    dealerPosition: number
  ): Array<{ userId: string; position: number }> {
    const maxPosition = Math.max(...winners.map(w => w.position));
    const numSeats = maxPosition + 1;

    return winners
      .map(w => ({
        ...w,
        // Calculate distance clockwise from dealer's left
        relativePosition: (w.position - dealerPosition - 1 + numSeats) % numSeats,
      }))
      .sort((a, b) => a.relativePosition - b.relativePosition)
      .map(w => ({ userId: w.userId, position: w.position }));
  }
}

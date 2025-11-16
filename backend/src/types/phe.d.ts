/**
 * TypeScript type definitions for 'phe' (Poker Hand Evaluator)
 * Port of HenryRLee's PokerHandEvaluator
 *
 * @see https://github.com/thlorenz/phe
 * @see https://github.com/HenryRLee/PokerHandEvaluator
 */

declare module 'phe' {
  /**
   * Card format: Two-character string [rank][suit]
   * Ranks: 2-9, T (ten), J, Q, K, A
   * Suits: s (spades), h (hearts), d (diamonds), c (clubs)
   * Examples: 'Ah' = Ace of hearts, 'Td' = Ten of diamonds
   */
  export type Card = string;

  /**
   * Board format: Space-separated card string
   * Example: 'As Ks 4h Ad Kd'
   */
  export type Board = string;

  /**
   * Hand rank (0-8, lower is better)
   * 0 = STRAIGHT_FLUSH
   * 1 = FOUR_OF_A_KIND
   * 2 = FULL_HOUSE
   * 3 = FLUSH
   * 4 = STRAIGHT
   * 5 = THREE_OF_A_KIND
   * 6 = TWO_PAIR
   * 7 = ONE_PAIR
   * 8 = HIGH_CARD
   */
  export type HandRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  /**
   * Hand rank descriptions (human-readable names)
   */
  export const rankDescription: readonly [
    'Straight Flush',
    'Four of a Kind',
    'Full House',
    'Flush',
    'Straight',
    'Three of a Kind',
    'Two Pair',
    'One Pair',
    'High Card'
  ];

  /**
   * Evaluate hand from card array
   * @param cards - Array of 5-7 cards
   * @returns Hand strength (lower is better)
   */
  export function evaluateCards(cards: Card[]): number;

  /**
   * Fast version of evaluateCards (no validation)
   * @param cards - Array of 5-7 cards
   * @returns Hand strength (lower is better)
   */
  export function evaluateCardsFast(cards: Card[]): number;

  /**
   * Evaluate hand from numeric card codes
   * @param cards - Array of numeric card codes
   * @returns Hand strength (lower is better)
   */
  export function evaluateCardCodes(cards: number[]): number;

  /**
   * Evaluate hand from board string
   * @param board - Space-separated cards
   * @returns Hand strength (lower is better)
   */
  export function evaluateBoard(board: Board): number;

  /**
   * Get hand rank from card array
   * @param cards - Array of 5-7 cards
   * @returns Hand rank (0-8)
   */
  export function rankCards(cards: Card[]): HandRank;

  /**
   * Fast version of rankCards (no validation)
   * @param cards - Array of 5-7 cards
   * @returns Hand rank (0-8)
   */
  export function rankCardsFast(cards: Card[]): HandRank;

  /**
   * Get hand rank from numeric card codes
   * @param cardCodes - Array of numeric card codes
   * @returns Hand rank (0-8)
   */
  export function rankCardCodes(cardCodes: number[]): HandRank;

  /**
   * Get hand rank from board string
   * @param board - Space-separated cards
   * @returns Hand rank (0-8)
   */
  export function rankBoard(board: Board): HandRank;

  /**
   * Convert single card to numeric code
   * @param rank - Card rank (0-12: 2-A)
   * @param suit - Card suit (0-3: s,h,d,c)
   * @returns Numeric card code
   */
  export function cardCode(rank: number, suit: number): number;

  /**
   * Convert card array to numeric codes
   * @param cards - Array of cards
   * @returns Array of numeric codes
   */
  export function cardCodes(cards: Card[]): number[];

  /**
   * Convert board string to numeric codes
   * @param board - Space-separated cards
   * @returns Array of numeric codes
   */
  export function boardCodes(board: Board): number[];

  /**
   * Convert numeric code to card string
   * @param code - Numeric card code
   * @returns Card string
   */
  export function stringifyCardCode(code: number): Card;

  /**
   * Convert rank index to character
   * @param rank - Rank index (0-12)
   * @returns Rank character (2-9,T,J,Q,K,A)
   */
  export function stringifyRank(rank: number): string;

  /**
   * Convert suit index to character
   * @param suit - Suit index (0-3)
   * @returns Suit character (s,h,d,c)
   */
  export function stringifySuit(suit: number): string;
}

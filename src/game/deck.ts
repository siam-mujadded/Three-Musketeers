import type { Card, Rank } from './types';

export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const COPIES_PER_RANK = 3;
export const DECK_SIZE = RANKS.length * COPIES_PER_RANK;

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (let copy = 0; copy < COPIES_PER_RANK; copy++) {
      deck.push({ id: `r${rank}-${copy}`, rank });
    }
  }
  return deck;
}

// Mulberry32 seeded PRNG for deterministic, testable shuffles.
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function deal(deck: Card[], playerCount: 4 | 6): Card[][] {
  if (deck.length !== DECK_SIZE) {
    throw new Error(`Deck must be ${DECK_SIZE} cards, got ${deck.length}`);
  }
  const perPlayer = DECK_SIZE / playerCount;
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < deck.length; i++) {
    hands[i % playerCount].push(deck[i]);
  }
  for (const hand of hands) {
    hand.sort((a, b) => a.rank - b.rank);
  }
  void perPlayer;
  return hands;
}

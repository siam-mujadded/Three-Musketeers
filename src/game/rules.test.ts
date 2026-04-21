import { describe, it, expect } from 'vitest';
import { buildDeck, deal, shuffle, DECK_SIZE } from './deck';
import {
  createInitialState,
  submitSwapChoice,
  beginTurn,
  makeGuess,
  finalizeResolution,
  smallestOf,
  largestOf,
  activePlayer,
  findPlayer,
  projectStateForPlayer,
  POINTS_TO_WIN,
  MISMATCH_REVEAL_MS,
} from './rules';
import type { GameState } from './types';

function setup4(seed = 42): GameState {
  return createInitialState({
    playerCount: 4,
    playerNames: ['Athos', 'Porthos', 'Aramis', "D'Artagnan"],
    teamAssignments: ['T1', 'T2', 'T1', 'T2'],
    startingPlayerIndex: 0,
    seed,
  });
}

function setup6(seed = 7): GameState {
  return createInitialState({
    playerCount: 6,
    playerNames: ['A', 'B', 'C', 'D', 'E', 'F'],
    teamAssignments: ['T1', 'T2', 'T3', 'T1', 'T2', 'T3'],
    startingPlayerIndex: 0,
    seed,
  });
}

function skipAllInitialSwaps(state: GameState): GameState {
  let s = state;
  while (s.phase === 'initialSwap') {
    // Every player in every pending team votes skip.
    const pending = s.pendingSwapTeamIds.slice();
    for (const teamId of pending) {
      const team = s.teams.find((t) => t.id === teamId)!;
      for (const pid of team.playerIds) {
        if (!s.swapChoices[teamId]?.[pid]) {
          s = submitSwapChoice(s, pid, { skip: true });
        }
      }
    }
  }
  return s;
}

describe('deck', () => {
  it('builds a 36-card deck with 3 copies of each rank 1-12', () => {
    const d = buildDeck();
    expect(d).toHaveLength(DECK_SIZE);
    for (let r = 1; r <= 12; r++) {
      expect(d.filter((c) => c.rank === r)).toHaveLength(3);
    }
  });

  it('shuffle is deterministic with the same seed', () => {
    const a = shuffle(buildDeck(), 123);
    const b = shuffle(buildDeck(), 123);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it('deal gives 9 cards per player for 4p and 6 per player for 6p', () => {
    const h4 = deal(buildDeck(), 4);
    h4.forEach((h) => expect(h).toHaveLength(9));
    const h6 = deal(shuffle(buildDeck(), 1), 6);
    h6.forEach((h) => expect(h).toHaveLength(6));
  });
});

describe('smallest/largest', () => {
  it('returns the smallest and largest cards', () => {
    const hand = [
      { id: 'a', rank: 5 as const },
      { id: 'b', rank: 2 as const },
      { id: 'c', rank: 9 as const },
    ];
    expect(smallestOf(hand)?.rank).toBe(2);
    expect(largestOf(hand)?.rank).toBe(9);
  });
});

describe('setup', () => {
  it('creates valid 4-player state', () => {
    const s = setup4();
    expect(s.players).toHaveLength(4);
    expect(s.teams).toHaveLength(2);
    s.players.forEach((p) => expect(p.hand).toHaveLength(9));
    expect(s.turnOrder).toHaveLength(4);
    expect(s.phase).toBe('initialSwap');
    expect(s.pendingSwapTeamIds).toHaveLength(2);
  });

  it('creates valid 6-player state', () => {
    const s = setup6();
    expect(s.players).toHaveLength(6);
    expect(s.teams).toHaveLength(3);
    s.players.forEach((p) => expect(p.hand).toHaveLength(6));
  });

  it('rejects invalid team configuration', () => {
    expect(() =>
      createInitialState({
        playerCount: 4,
        playerNames: ['A', 'B', 'C', 'D'],
        teamAssignments: ['T1', 'T1', 'T1', 'T2'],
        startingPlayerIndex: 0,
        seed: 1,
      })
    ).toThrow();
  });
});

describe('initial swap', () => {
  it('exchanges one card when both teammates pick', () => {
    let s = setup4(9);
    const team = s.teams[0];
    const [aId, bId] = team.playerIds;
    const a = findPlayer(s, aId);
    const b = findPlayer(s, bId);
    const aCard = a.hand[0];
    const bCard = b.hand[0];
    s = submitSwapChoice(s, aId, { cardId: aCard.id });
    expect(s.phase).toBe('initialSwap');
    s = submitSwapChoice(s, bId, { cardId: bCard.id });
    const a2 = findPlayer(s, aId);
    const b2 = findPlayer(s, bId);
    expect(a2.hand.some((c) => c.id === bCard.id)).toBe(true);
    expect(b2.hand.some((c) => c.id === aCard.id)).toBe(true);
    expect(a2.hand).toHaveLength(9);
    expect(b2.hand).toHaveLength(9);
    // Highlights point at the card each player received.
    expect(s.lastSwapReceivedCardId[aId]).toBe(bCard.id);
    expect(s.lastSwapReceivedCardId[bId]).toBe(aCard.id);
  });

  it('skipping by either teammate cancels the swap for that team', () => {
    let s = setup4(12);
    const team = s.teams[0];
    const [aId, bId] = team.playerIds;
    const a = findPlayer(s, aId);
    const handBefore = a.hand.slice();
    s = submitSwapChoice(s, aId, { cardId: a.hand[0].id });
    s = submitSwapChoice(s, bId, { skip: true });
    const a2 = findPlayer(s, aId);
    expect(a2.hand.map((c) => c.id).sort()).toEqual(handBefore.map((c) => c.id).sort());
  });

  it('advances to turnStart once all pending teams resolve', () => {
    let s = skipAllInitialSwaps(setup4(3));
    expect(s.phase).toBe('turnStart');
  });
});

describe('turn rotation (anticlockwise)', () => {
  it('visits all seats', () => {
    let s = skipAllInitialSwaps(setup4());
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const me = activePlayer(s);
      seen.add(me.id);
      s = beginTurn(s);
      s = makeGuess(s, me.id, 'smallest');
      const other = s.players.find((p) => p.id !== me.id && p.hand.length > 0)!;
      s = makeGuess(s, other.id, 'largest');
      while (s.phase === 'guess3') {
        const third = s.players.find(
          (p) => p.id !== me.id && p.id !== other.id && p.hand.length > 0
        )!;
        s = makeGuess(s, third.id, 'largest');
      }
      if (s.phase === 'turnResolve') {
        s = finalizeResolution(s);
      }
      // If phase is postScoreSwap (very unlikely here), resolve it fast.
      while (s.phase === 'postScoreSwap') {
        const teamId = s.pendingSwapTeamIds[0];
        const team = s.teams.find((t) => t.id === teamId)!;
        for (const pid of team.playerIds) {
          if (!s.swapChoices[teamId]?.[pid]) {
            s = submitSwapChoice(s, pid, { skip: true });
          }
        }
      }
    }
    expect(seen.size).toBe(4);
  });
});

describe('guess flow', () => {
  it('mismatch on guess 2 enters turnResolve, then finalizes back to turnStart', () => {
    let s = skipAllInitialSwaps(setup4(1));
    s = beginTurn(s);
    const me = activePlayer(s);
    const before = s.players.map((p) => p.hand.length).join(',');
    const small1 = smallestOf(findPlayer(s, me.id).hand)!.rank;
    s = makeGuess(s, me.id, 'smallest', 1_000_000);
    const other = s.players.find((p) => p.id !== me.id)!;
    const large2 = largestOf(findPlayer(s, other.id).hand)!.rank;
    s = makeGuess(s, other.id, 'largest', 1_000_000);
    if (small1 !== large2) {
      expect(s.phase).toBe('turnResolve');
      expect(s.resolveKind).toBe('mismatch');
      expect(s.resolveAt).toBe(1_000_000 + MISMATCH_REVEAL_MS);
      expect(s.currentReveals.length).toBeGreaterThan(0);
      s = finalizeResolution(s);
      expect(s.phase).toBe('turnStart');
      expect(s.currentReveals).toHaveLength(0);
      expect(s.resolveAt).toBeNull();
      expect(s.resolveKind).toBeNull();
      const after = s.players.map((p) => p.hand.length).join(',');
      expect(after).toBe(before);
    }
  });

  it('three-match scores a point and moves cards to discard', () => {
    let s = skipAllInitialSwaps(setup4(2));
    // Stack three rank-1 cards as smallest in three distinct players.
    const rank = 1 as const;
    const picks = [
      { id: 'r1-0', rank },
      { id: 'r1-1', rank },
      { id: 'r1-2', rank },
    ];
    s = {
      ...s,
      players: s.players.map((p, i) => {
        if (i < 3) {
          return {
            ...p,
            hand: [picks[i], ...p.hand.filter((c) => c.id !== picks[i].id)],
          };
        }
        return {
          ...p,
          hand: p.hand.filter(
            (c) => c.id !== picks[0].id && c.id !== picks[1].id && c.id !== picks[2].id
          ),
        };
      }),
    };
    s = beginTurn(s);
    s = makeGuess(s, s.players[0].id, 'smallest');
    s = makeGuess(s, s.players[1].id, 'smallest');
    s = makeGuess(s, s.players[2].id, 'smallest');
    // Three-match now enters a celebration resolve window before discarding.
    expect(s.phase).toBe('turnResolve');
    expect(s.resolveKind).toBe('score');
    expect(s.currentReveals.filter((r) => r.card.rank === rank)).toHaveLength(3);
    // No points awarded yet, cards still pending discard.
    expect(s.teams.reduce((sum, t) => sum + t.points, 0)).toBe(0);
    expect(s.discard.filter((c) => c.rank === rank)).toHaveLength(0);
    s = finalizeResolution(s);
    expect(s.teams.reduce((sum, t) => sum + t.points, 0)).toBe(1);
    expect(s.discard.filter((c) => c.rank === rank)).toHaveLength(3);
    // Phase should be either postScoreSwap (with other teams pending) or turnStart.
    expect(['postScoreSwap', 'turnStart', 'victory']).toContain(s.phase);
  });
});

describe('projection', () => {
  it('hides opponents\' hands but preserves counts', () => {
    const s = setup4(33);
    const viewer = s.players[0].id;
    const pub = projectStateForPlayer(s, viewer);
    const me = pub.players.find((p) => p.id === viewer)!;
    expect(me.hand).toBeDefined();
    expect(me.hand!.length).toBe(me.handCount);
    for (const p of pub.players) {
      if (p.id !== viewer) {
        expect(p.hand).toBeUndefined();
        expect(typeof p.handCount).toBe('number');
      }
    }
  });
});

describe('win condition', () => {
  it('points to win is 4', () => {
    expect(POINTS_TO_WIN).toBe(4);
  });
});

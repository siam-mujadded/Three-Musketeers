import type {
  Card,
  GameState,
  Player,
  PublicGameState,
  PublicPlayer,
  RevealedCard,
  Team,
  WhichCard,
} from './types';
import { buildDeck, deal, shuffle } from './deck';

export const POINTS_TO_WIN = 4;

/** Milliseconds that mismatched reveals stay visible so players can memorize them. */
export const MISMATCH_REVEAL_MS = 3500;

/** Milliseconds that a matched set stays visible so all players see the score animation. */
export const SCORE_CELEBRATION_MS = 2500;

export interface SetupInput {
  playerCount: 4 | 6;
  playerNames: string[];
  teamAssignments: string[];
  startingPlayerIndex: number;
  seed?: number;
  /** Optional explicit player IDs (from the lobby). */
  playerIds?: string[];
}

export function createInitialState(input: SetupInput): GameState {
  const { playerCount, playerNames, teamAssignments, startingPlayerIndex } = input;
  if (playerNames.length !== playerCount) {
    throw new Error('playerNames length must equal playerCount');
  }
  if (teamAssignments.length !== playerCount) {
    throw new Error('teamAssignments length must equal playerCount');
  }
  const teamIds = Array.from(new Set(teamAssignments));
  const expectedTeamCount = playerCount / 2;
  if (teamIds.length !== expectedTeamCount) {
    throw new Error(`Expected ${expectedTeamCount} teams, got ${teamIds.length}`);
  }
  for (const tid of teamIds) {
    const size = teamAssignments.filter((t) => t === tid).length;
    if (size !== 2) throw new Error(`Team ${tid} must have exactly 2 players`);
  }

  const seed = input.seed ?? ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
  const deck = shuffle(buildDeck(), seed);
  const hands = deal(deck, playerCount);

  const seating = buildSeating(teamAssignments);
  const providedIds = input.playerIds;

  const players: Player[] = seating.map((playerIdx, seatIndex) => ({
    id: providedIds ? providedIds[playerIdx] : `p${playerIdx}`,
    name: playerNames[playerIdx],
    teamId: teamAssignments[playerIdx],
    seatIndex,
    hand: hands[seatIndex],
  }));

  const teams: Team[] = teamIds.map((id, i) => ({
    id,
    name: `Team ${String.fromCharCode(65 + i)}`,
    playerIds: players.filter((p) => p.teamId === id).map((p) => p.id),
    points: 0,
  }));

  // Anticlockwise turn order: next player is (current - 1 + N) % N.
  const turnOrder: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const seat = (startingPlayerIndex - i + playerCount) % playerCount;
    turnOrder.push(players[seat].id);
  }

  return {
    phase: 'initialSwap',
    players,
    teams,
    turnOrder,
    activePlayerIndex: 0,
    discard: [],
    currentReveals: [],
    lastTurnMessage: null,
    winningTeamId: null,
    pendingSwapTeamIds: teamIds.slice(),
    swapChoices: {},
    scoringTeamId: null,
    pointsToWin: POINTS_TO_WIN,
    seed,
    resolveAt: null,
    resolveKind: null,
    lastSwapReceivedCardId: {},
  };
}

function buildSeating(teamAssignments: string[]): number[] {
  const teamIds = Array.from(new Set(teamAssignments));
  const byTeam: Record<string, number[]> = {};
  for (const tid of teamIds) byTeam[tid] = [];
  teamAssignments.forEach((tid, idx) => byTeam[tid].push(idx));
  const seats: number[] = [];
  const cursors: Record<string, number> = {};
  for (const tid of teamIds) cursors[tid] = 0;
  for (let i = 0; i < teamAssignments.length; i++) {
    const tid = teamIds[i % teamIds.length];
    seats.push(byTeam[tid][cursors[tid]++]);
  }
  return seats;
}

export function smallestOf(hand: Card[]): Card | null {
  if (hand.length === 0) return null;
  let best = hand[0];
  for (const c of hand) if (c.rank < best.rank) best = c;
  return best;
}

export function largestOf(hand: Card[]): Card | null {
  if (hand.length === 0) return null;
  let best = hand[0];
  for (const c of hand) if (c.rank > best.rank) best = c;
  return best;
}

export function pickCard(hand: Card[], which: WhichCard): Card | null {
  return which === 'smallest' ? smallestOf(hand) : largestOf(hand);
}

export function activePlayer(state: GameState): Player {
  const id = state.turnOrder[state.activePlayerIndex];
  const p = state.players.find((pl) => pl.id === id);
  if (!p) throw new Error('Active player missing');
  return p;
}

export function findPlayer(state: GameState, playerId: string): Player {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) throw new Error(`Player ${playerId} not found`);
  return p;
}

export function findTeam(state: GameState, teamId: string): Team {
  const t = state.teams.find((tm) => tm.id === teamId);
  if (!t) throw new Error(`Team ${teamId} not found`);
  return t;
}

// ---------------- Swap mechanics ----------------

export function submitSwapChoice(
  state: GameState,
  playerId: string,
  choice: { cardId?: string; skip?: boolean }
): GameState {
  if (state.phase !== 'initialSwap' && state.phase !== 'postScoreSwap') {
    throw new Error('Not in a swap phase');
  }
  const player = findPlayer(state, playerId);
  const teamId = player.teamId;
  if (!state.pendingSwapTeamIds.includes(teamId)) {
    throw new Error(`Team ${teamId} is not pending a swap`);
  }
  if (choice.cardId) {
    const owns = player.hand.some((c) => c.id === choice.cardId);
    if (!owns) throw new Error('Card not in player hand');
  }

  const teamChoices = { ...(state.swapChoices[teamId] ?? {}) };
  teamChoices[playerId] = choice;
  const swapChoices = { ...state.swapChoices, [teamId]: teamChoices };
  let next: GameState = { ...state, swapChoices };

  const team = findTeam(state, teamId);
  const [aId, bId] = team.playerIds;
  const aChoice = teamChoices[aId];
  const bChoice = teamChoices[bId];
  if (aChoice && bChoice) {
    next = resolveTeamSwap(next, teamId);
  }

  // If all pending teams have resolved, advance phase.
  if (next.pendingSwapTeamIds.length === 0) {
    const wasInitial = state.phase === 'initialSwap';
    next = {
      ...next,
      swapChoices: {},
      phase: wasInitial ? 'turnStart' : 'turnStart',
      scoringTeamId: null,
    };
  }
  return next;
}

function resolveTeamSwap(state: GameState, teamId: string): GameState {
  const team = findTeam(state, teamId);
  const [aId, bId] = team.playerIds;
  const teamChoices = state.swapChoices[teamId] ?? {};
  const aChoice = teamChoices[aId];
  const bChoice = teamChoices[bId];
  const pending = state.pendingSwapTeamIds.filter((t) => t !== teamId);

  // If either skipped, no exchange.
  if (!aChoice?.cardId || !bChoice?.cardId || aChoice.skip || bChoice.skip) {
    return { ...state, pendingSwapTeamIds: pending };
  }

  const a = findPlayer(state, aId);
  const b = findPlayer(state, bId);
  const cardA = a.hand.find((c) => c.id === aChoice.cardId)!;
  const cardB = b.hand.find((c) => c.id === bChoice.cardId)!;

  const players = state.players.map((p) => {
    if (p.id === aId) {
      return { ...p, hand: sortHand([...p.hand.filter((c) => c.id !== cardA.id), cardB]) };
    }
    if (p.id === bId) {
      return { ...p, hand: sortHand([...p.hand.filter((c) => c.id !== cardB.id), cardA]) };
    }
    return p;
  });
  const lastSwapReceivedCardId = {
    ...state.lastSwapReceivedCardId,
    [aId]: cardB.id,
    [bId]: cardA.id,
  };
  return { ...state, players, pendingSwapTeamIds: pending, lastSwapReceivedCardId };
}

// ---------------- Turn / Guess mechanics ----------------

export function beginTurn(state: GameState): GameState {
  if (state.phase !== 'turnStart') throw new Error('Not in turn start phase');
  return { ...state, phase: 'guess1', currentReveals: [], lastTurnMessage: null };
}

export function makeGuess(
  state: GameState,
  targetPlayerId: string,
  which: WhichCard,
  now: number = Date.now()
): GameState {
  if (state.phase !== 'guess1' && state.phase !== 'guess2' && state.phase !== 'guess3') {
    throw new Error('Not in a guess phase');
  }
  const target = findPlayer(state, targetPlayerId);
  const card = pickCard(target.hand, which);
  if (!card) {
    return failTurn(state, `${target.name} has no cards.`);
  }
  const stateMinusCard = updatePlayers(state, (p) =>
    p.id === target.id ? { ...p, hand: p.hand.filter((c) => c.id !== card.id) } : p
  );
  const reveal: RevealedCard = { card, fromPlayerId: target.id, which };
  const reveals = [...state.currentReveals, reveal];

  if (state.phase === 'guess1') {
    return { ...stateMinusCard, currentReveals: reveals, phase: 'guess2' };
  }

  const prev = reveals[reveals.length - 2];
  if (prev.card.rank !== reveal.card.rank) {
    return {
      ...stateMinusCard,
      currentReveals: reveals,
      phase: 'turnResolve',
      resolveKind: 'mismatch',
      resolveAt: now + MISMATCH_REVEAL_MS,
      lastTurnMessage: `Mismatch at guess ${reveals.length}. Memorize the cards!`,
    };
  }

  if (state.phase === 'guess2') {
    return { ...stateMinusCard, currentReveals: reveals, phase: 'guess3' };
  }

  // Third match: enter a celebration resolve window so every table sees
  // the three-of-a-kind before they get discarded.
  const active = activePlayer(state);
  const team = findTeam(state, active.teamId);
  return {
    ...stateMinusCard,
    currentReveals: reveals,
    phase: 'turnResolve',
    resolveKind: 'score',
    resolveAt: now + SCORE_CELEBRATION_MS,
    scoringTeamId: team.id,
    lastTurnMessage: `${team.name} scored a trio!`,
  };
}

/**
 * Advances past a `turnResolve` phase by returning the revealed cards to their
 * owners and rotating the active seat. Safe to call on any phase (no-op when
 * the game isn't resolving).
 */
export function finalizeResolution(state: GameState): GameState {
  if (state.phase !== 'turnResolve') return state;
  if (state.resolveKind === 'mismatch') {
    const returned = returnRevealedCards(state);
    return endTurn(returned, state.lastTurnMessage ?? null);
  }
  if (state.resolveKind === 'score') {
    return commitScore(state);
  }
  return state;
}

function failTurn(state: GameState, message: string): GameState {
  const returned = returnRevealedCards(state);
  return endTurn(returned, message);
}

function returnRevealedCards(state: GameState): GameState {
  if (state.currentReveals.length === 0) return state;
  return updatePlayers(
    { ...state, currentReveals: [] },
    (p) => {
      const back = state.currentReveals
        .filter((r) => r.fromPlayerId === p.id)
        .map((r) => r.card);
      if (back.length === 0) return p;
      return { ...p, hand: sortHand([...p.hand, ...back]) };
    }
  );
}

/**
 * Commits the scored trio once the celebration window has elapsed: sends the
 * three matched cards to the discard pile, awards the point, and transitions
 * to the next phase (postScoreSwap, turnStart, or victory).
 */
function commitScore(state: GameState): GameState {
  const teamId = state.scoringTeamId;
  if (!teamId) return state;
  const team = findTeam(state, teamId);
  const discardAdds = state.currentReveals.map((r) => r.card);
  const newTeams = state.teams.map((t) =>
    t.id === team.id ? { ...t, points: t.points + 1 } : t
  );
  const winning = newTeams.find((t) => t.points >= state.pointsToWin);
  const base: GameState = {
    ...state,
    teams: newTeams,
    discard: sortHand([...state.discard, ...discardAdds]),
    currentReveals: [],
    resolveAt: null,
    resolveKind: null,
    lastTurnMessage: `${team.name} scored! (${team.points + 1}/${state.pointsToWin})`,
  };
  if (winning) {
    return { ...base, phase: 'victory', winningTeamId: winning.id };
  }
  const otherTeams = state.teams.filter((t) => t.id !== team.id).map((t) => t.id);
  return {
    ...base,
    phase: otherTeams.length > 0 ? 'postScoreSwap' : 'turnStart',
    pendingSwapTeamIds: otherTeams,
    swapChoices: {},
    scoringTeamId: team.id,
    activePlayerIndex: advanceIndex(state),
    lastSwapReceivedCardId: otherTeams.length > 0 ? {} : state.lastSwapReceivedCardId,
  };
}

function endTurn(state: GameState, message: string | null): GameState {
  return {
    ...state,
    phase: 'turnStart',
    activePlayerIndex: advanceIndex(state),
    currentReveals: [],
    lastTurnMessage: message,
    resolveAt: null,
    resolveKind: null,
  };
}

function advanceIndex(state: GameState): number {
  return (state.activePlayerIndex + 1) % state.turnOrder.length;
}

function updatePlayers(state: GameState, fn: (p: Player) => Player): GameState {
  return { ...state, players: state.players.map(fn) };
}

function sortHand(cards: Card[]): Card[] {
  return cards.slice().sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
}

export function checkWinner(state: GameState): Team | null {
  return state.teams.find((t) => t.points >= state.pointsToWin) ?? null;
}

// ---------------- Projection for network delivery ----------------

export function projectStateForPlayer(
  state: GameState,
  viewerId: string
): PublicGameState {
  const players: PublicPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    seatIndex: p.seatIndex,
    handCount: p.hand.length,
    hand: p.id === viewerId ? p.hand : undefined,
  }));
  const activePlayerId = state.turnOrder[state.activePlayerIndex];
  return {
    phase: state.phase,
    players,
    teams: state.teams,
    turnOrder: state.turnOrder,
    activePlayerIndex: state.activePlayerIndex,
    activePlayerId,
    discard: state.discard,
    currentReveals: state.currentReveals,
    lastTurnMessage: state.lastTurnMessage,
    winningTeamId: state.winningTeamId,
    pendingSwapTeamIds: state.pendingSwapTeamIds,
    swapChoices: state.swapChoices,
    scoringTeamId: state.scoringTeamId,
    pointsToWin: state.pointsToWin,
    viewerId,
    resolveAt: state.resolveAt,
    resolveKind: state.resolveKind,
    lastSwapReceivedCardId: state.lastSwapReceivedCardId,
  };
}

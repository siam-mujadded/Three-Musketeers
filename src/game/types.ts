export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface Card {
  id: string;
  rank: Rank;
}

export type WhichCard = 'smallest' | 'largest';

export interface Player {
  id: string;
  name: string;
  teamId: string;
  seatIndex: number;
  hand: Card[];
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  points: number;
}

export interface RevealedCard {
  card: Card;
  fromPlayerId: string;
  which: WhichCard;
}

export type Phase =
  | 'setup'
  | 'initialSwap'
  | 'turnStart'
  | 'guess1'
  | 'guess2'
  | 'guess3'
  | 'turnResolve'
  | 'postScoreSwap'
  | 'victory';

export interface GameState {
  phase: Phase;
  players: Player[];
  teams: Team[];
  turnOrder: string[];
  activePlayerIndex: number;
  discard: Card[];
  currentReveals: RevealedCard[];
  lastTurnMessage: string | null;
  winningTeamId: string | null;
  pendingSwapTeamIds: string[];
  /**
   * During initialSwap or postScoreSwap, the per-team per-player pick:
   *  - undefined: hasn't chosen yet
   *  - { cardId: string }: picked a card to offer
   *  - { skip: true }: voted to skip for this team
   * Once both teammates on a pending team have chosen, the server commits.
   */
  swapChoices: Record<string, Record<string, { cardId?: string; skip?: boolean }>>;
  scoringTeamId: string | null;
  pointsToWin: number;
  seed: number;
  /**
   * When `phase === 'turnResolve'`, holds the epoch-ms deadline at which
   * the server will call `finalizeResolution` to return the revealed cards
   * and advance the turn. Clients render a countdown using this.
   */
  resolveAt: number | null;
  /** What `turnResolve` is waiting on. */
  resolveKind: ResolveKind | null;
  /**
   * Per-player id of the card most recently received via a team swap. Used by
   * the UI to highlight the incoming card so the receiver can tell at a glance
   * which rank is new in their hand. Cleared whenever a fresh swap cycle begins.
   */
  lastSwapReceivedCardId: Record<string, string | null>;
}

export type ResolveKind = 'mismatch' | 'score';

// Public projection: opponents' hand contents are hidden; only counts leak.
export interface PublicPlayer {
  id: string;
  name: string;
  teamId: string;
  seatIndex: number;
  handCount: number;
  // Present only for the viewer themself.
  hand?: Card[];
}

export interface PublicGameState {
  phase: Phase;
  players: PublicPlayer[];
  teams: Team[];
  turnOrder: string[];
  activePlayerIndex: number;
  activePlayerId: string;
  discard: Card[];
  currentReveals: RevealedCard[];
  lastTurnMessage: string | null;
  winningTeamId: string | null;
  pendingSwapTeamIds: string[];
  swapChoices: Record<string, Record<string, { cardId?: string; skip?: boolean }>>;
  scoringTeamId: string | null;
  pointsToWin: number;
  viewerId: string;
  resolveAt: number | null;
  resolveKind: ResolveKind | null;
  lastSwapReceivedCardId: Record<string, string | null>;
}

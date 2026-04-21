import type { PublicGameState, WhichCard } from './types';

export interface LobbyPlayer {
  id: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface Lobby {
  code: string;
  playerCount: 4 | 6;
  hostId: string;
  players: LobbyPlayer[];
}

export type ClientMessage =
  | { t: 'hello'; name: string; sessionId?: string }
  | { t: 'create'; playerCount: 4 | 6 }
  | { t: 'join' }
  | { t: 'leave' }
  | { t: 'startGame' }
  | { t: 'swapChoice'; cardId?: string; skip?: boolean }
  | { t: 'beginTurn' }
  | { t: 'guess'; targetPlayerId: string; which: WhichCard }
  | { t: 'playAgain' };

export type ServerMessage =
  | { t: 'welcome'; sessionId: string }
  | { t: 'lobby'; lobby: Lobby; you: { playerId: string } }
  | { t: 'game'; lobby: Lobby; state: PublicGameState }
  | { t: 'left' }
  | { t: 'abandoned'; reason: string }
  | { t: 'error'; code: string; message: string };

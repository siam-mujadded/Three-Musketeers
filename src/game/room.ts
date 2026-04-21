import type { GameState, WhichCard } from './types';
import type { Lobby, LobbyPlayer, ServerMessage } from './protocol';
import {
  beginTurn as engineBeginTurn,
  createInitialState,
  finalizeResolution,
  makeGuess,
  projectStateForPlayer,
  submitSwapChoice,
} from './rules';

export interface SessionMember {
  sessionId: string;
  playerId: string;
  name: string;
  connected: boolean;
}

export interface RoomSnapshot {
  code: string;
  phase: 'lobby' | 'playing' | 'ended';
  playerCount: 4 | 6;
  hostSessionId: string | null;
  members: SessionMember[];
  game: GameState | null;
  /** Persisted so we can restart with the same lobby. */
  lastSeed?: number;
}

export function emptyRoom(code: string, playerCount: 4 | 6): RoomSnapshot {
  return {
    code,
    phase: 'lobby',
    playerCount,
    hostSessionId: null,
    members: [],
    game: null,
  };
}

function lobbyMessage(room: RoomSnapshot): Lobby {
  return {
    code: room.code,
    playerCount: room.playerCount,
    hostId: room.hostSessionId ?? '',
    players: room.members.map<LobbyPlayer>((m) => ({
      id: m.playerId,
      name: m.name,
      connected: m.connected,
      isHost: m.sessionId === room.hostSessionId,
    })),
  };
}

function personalMessages(room: RoomSnapshot): Array<{ sessionId: string; msg: ServerMessage }> {
  const lobby = lobbyMessage(room);
  if (room.phase === 'lobby') {
    return room.members.map((m) => ({
      sessionId: m.sessionId,
      msg: { t: 'lobby', lobby, you: { playerId: m.playerId } } satisfies ServerMessage,
    }));
  }
  if (room.phase === 'playing' && room.game) {
    const game = room.game;
    return room.members.map((m) => ({
      sessionId: m.sessionId,
      msg: { t: 'game', lobby, state: projectStateForPlayer(game, m.playerId) } satisfies ServerMessage,
    }));
  }
  return [];
}

/**
 * Produces the messages to deliver to each session after a state transition.
 * The server uses this to push updates to all connected WebSockets.
 */
export function personalizedBroadcasts(
  room: RoomSnapshot
): Array<{ sessionId: string; msg: ServerMessage }> {
  return personalMessages(room);
}

// ---------------- Room actions (pure) ----------------

function genPlayerId(existing: string[]): string {
  let i = 0;
  while (existing.includes(`p${i}`)) i++;
  return `p${i}`;
}

export function handleCreate(
  room: RoomSnapshot,
  sessionId: string,
  name: string,
  playerCount: 4 | 6
): RoomSnapshot {
  if (room.members.length > 0) throw new Error('Room already created');
  const playerId = genPlayerId([]);
  return {
    ...room,
    playerCount,
    hostSessionId: sessionId,
    members: [{ sessionId, playerId, name, connected: true }],
  };
}

export function handleJoin(
  room: RoomSnapshot,
  sessionId: string,
  name: string
): RoomSnapshot {
  const existing = room.members.find((m) => m.sessionId === sessionId);
  if (existing) {
    // Reconnect: just mark connected.
    return {
      ...room,
      members: room.members.map((m) =>
        m.sessionId === sessionId ? { ...m, connected: true, name: name || m.name } : m
      ),
    };
  }
  if (room.phase !== 'lobby') {
    throw new Error('Game already started; cannot join.');
  }
  if (room.members.length >= room.playerCount) {
    throw new Error('Room is full.');
  }
  const playerId = genPlayerId(room.members.map((m) => m.playerId));
  const hostSessionId = room.hostSessionId ?? sessionId;
  return {
    ...room,
    hostSessionId,
    members: [...room.members, { sessionId, playerId, name, connected: true }],
  };
}

export function handleDisconnect(room: RoomSnapshot, sessionId: string): RoomSnapshot {
  const member = room.members.find((m) => m.sessionId === sessionId);
  if (!member) return room;
  if (room.phase === 'lobby') {
    const members = room.members.filter((m) => m.sessionId !== sessionId);
    let hostSessionId = room.hostSessionId;
    if (hostSessionId === sessionId) {
      hostSessionId = members[0]?.sessionId ?? null;
    }
    return { ...room, members, hostSessionId };
  }
  return {
    ...room,
    members: room.members.map((m) =>
      m.sessionId === sessionId ? { ...m, connected: false } : m
    ),
  };
}

export function handleLeave(room: RoomSnapshot, sessionId: string): RoomSnapshot {
  const member = room.members.find((m) => m.sessionId === sessionId);
  if (!member) return room;
  if (room.phase === 'lobby') {
    return handleDisconnect(room, sessionId);
  }
  // Leaving mid-game abandons the game for everyone.
  return { ...room, phase: 'ended' };
}

export function canStart(room: RoomSnapshot): boolean {
  return (
    room.phase === 'lobby' &&
    room.members.length === room.playerCount &&
    room.members.every((m) => m.connected)
  );
}

export function handleStartGame(
  room: RoomSnapshot,
  sessionId: string,
  seedOverride?: number
): RoomSnapshot {
  if (sessionId !== room.hostSessionId) {
    throw new Error('Only the host can start the game.');
  }
  if (!canStart(room)) {
    throw new Error('Not enough players yet.');
  }
  const n = room.playerCount;
  const names = room.members.map((m) => m.name);
  const ids = room.members.map((m) => m.playerId);
  // Auto team assignment: alternate teams, pairs of two.
  const teamAssignments =
    n === 4 ? ['T1', 'T2', 'T1', 'T2'] : ['T1', 'T2', 'T3', 'T1', 'T2', 'T3'];
  const startingPlayerIndex = Math.floor(Math.random() * n);
  const game = createInitialState({
    playerCount: n,
    playerNames: names,
    teamAssignments,
    startingPlayerIndex,
    seed: seedOverride,
    playerIds: ids,
  });
  return { ...room, phase: 'playing', game, lastSeed: game.seed };
}

function memberBySession(room: RoomSnapshot, sessionId: string): SessionMember {
  const m = room.members.find((mm) => mm.sessionId === sessionId);
  if (!m) throw new Error('Not in this room.');
  return m;
}

export function handleSwapChoice(
  room: RoomSnapshot,
  sessionId: string,
  choice: { cardId?: string; skip?: boolean }
): RoomSnapshot {
  if (room.phase !== 'playing' || !room.game) throw new Error('No game in progress.');
  const member = memberBySession(room, sessionId);
  const game = submitSwapChoice(room.game, member.playerId, choice);
  return { ...room, game };
}

export function handleBeginTurn(room: RoomSnapshot, sessionId: string): RoomSnapshot {
  if (room.phase !== 'playing' || !room.game) throw new Error('No game in progress.');
  const member = memberBySession(room, sessionId);
  const activeId = room.game.turnOrder[room.game.activePlayerIndex];
  if (member.playerId !== activeId) throw new Error('Not your turn.');
  return { ...room, game: engineBeginTurn(room.game) };
}

export function handleGuess(
  room: RoomSnapshot,
  sessionId: string,
  targetPlayerId: string,
  which: WhichCard
): RoomSnapshot {
  if (room.phase !== 'playing' || !room.game) throw new Error('No game in progress.');
  const member = memberBySession(room, sessionId);
  const activeId = room.game.turnOrder[room.game.activePlayerIndex];
  if (member.playerId !== activeId) throw new Error('Not your turn.');
  return { ...room, game: makeGuess(room.game, targetPlayerId, which) };
}

export function handlePlayAgain(room: RoomSnapshot, sessionId: string): RoomSnapshot {
  if (sessionId !== room.hostSessionId) throw new Error('Only host can restart.');
  return { ...room, phase: 'lobby', game: null };
}

/**
 * Server-only transition that fires when the reveal-memorize window elapses.
 * Returns the unchanged room when the game isn't waiting on resolution.
 */
export function handleFinalizeResolution(room: RoomSnapshot): RoomSnapshot {
  if (room.phase !== 'playing' || !room.game) return room;
  if (room.game.phase !== 'turnResolve') return room;
  return { ...room, game: finalizeResolution(room.game) };
}


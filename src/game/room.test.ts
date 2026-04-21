import { describe, it, expect } from 'vitest';
import {
  emptyRoom,
  handleCreate,
  handleJoin,
  handleStartGame,
  handleSwapChoice,
  handleBeginTurn,
  handleGuess,
  handleLeave,
  handleDisconnect,
  canStart,
  personalizedBroadcasts,
} from './room';

function make4WithMembers() {
  let room = emptyRoom('ABCD', 4);
  room = handleCreate(room, 's1', 'Athos', 4);
  room = handleJoin(room, 's2', 'Porthos');
  room = handleJoin(room, 's3', 'Aramis');
  room = handleJoin(room, 's4', "D'Artagnan");
  return room;
}

describe('Room lobby', () => {
  it('host creates, others join, start requires full room', () => {
    let room = emptyRoom('ABCD', 4);
    room = handleCreate(room, 's1', 'Athos', 4);
    expect(room.hostSessionId).toBe('s1');
    expect(canStart(room)).toBe(false);
    room = handleJoin(room, 's2', 'Porthos');
    room = handleJoin(room, 's3', 'Aramis');
    expect(canStart(room)).toBe(false);
    room = handleJoin(room, 's4', "D'Artagnan");
    expect(canStart(room)).toBe(true);
  });

  it('rejects joiners when room is full', () => {
    const room = make4WithMembers();
    expect(() => handleJoin(room, 's5', 'Treville')).toThrow(/full/);
  });

  it('disconnect in lobby removes the player and transfers host', () => {
    let room = emptyRoom('X', 4);
    room = handleCreate(room, 's1', 'A', 4);
    room = handleJoin(room, 's2', 'B');
    room = handleDisconnect(room, 's1');
    expect(room.hostSessionId).toBe('s2');
    expect(room.members).toHaveLength(1);
  });

  it('only host can start', () => {
    const room = make4WithMembers();
    expect(() => handleStartGame(room, 's2')).toThrow(/host/);
  });
});

describe('Room game flow', () => {
  it('plays through to a forced score', () => {
    let room = make4WithMembers();
    room = handleStartGame(room, 's1', 4242);
    expect(room.phase).toBe('playing');
    expect(room.game).not.toBeNull();

    // Skip all initial swaps
    while (room.game && room.game.phase === 'initialSwap') {
      const game = room.game;
      const teamId = game.pendingSwapTeamIds[0];
      const team = game.teams.find((t) => t.id === teamId)!;
      for (const pid of team.playerIds) {
        if (!game.swapChoices[teamId]?.[pid]) {
          const sessionId = room.members.find((m) => m.playerId === pid)!.sessionId;
          room = handleSwapChoice(room, sessionId, { skip: true });
        }
      }
    }
    expect(room.game!.phase).toBe('turnStart');

    // Active player begins turn
    const activeId = room.game!.turnOrder[room.game!.activePlayerIndex];
    const activeSession = room.members.find((m) => m.playerId === activeId)!.sessionId;
    room = handleBeginTurn(room, activeSession);
    // Make a guess (may not score but should not throw)
    const others = room.game!.players.filter((p) => p.id !== activeId);
    expect(() => handleGuess(room, activeSession, others[0].id, 'smallest')).not.toThrow();
  });

  it('non-active player cannot guess', () => {
    let room = make4WithMembers();
    room = handleStartGame(room, 's1', 1);
    while (room.game && room.game.phase === 'initialSwap') {
      const game = room.game;
      const teamId = game.pendingSwapTeamIds[0];
      const team = game.teams.find((t) => t.id === teamId)!;
      for (const pid of team.playerIds) {
        if (!game.swapChoices[teamId]?.[pid]) {
          const sessionId = room.members.find((m) => m.playerId === pid)!.sessionId;
          room = handleSwapChoice(room, sessionId, { skip: true });
        }
      }
    }
    const activeId = room.game!.turnOrder[room.game!.activePlayerIndex];
    const wrong = room.members.find((m) => m.playerId !== activeId)!;
    expect(() => handleBeginTurn(room, wrong.sessionId)).toThrow(/turn/);
  });

  it('leaving mid-game abandons the room', () => {
    let room = make4WithMembers();
    room = handleStartGame(room, 's1', 2);
    room = handleLeave(room, 's3');
    expect(room.phase).toBe('ended');
  });
});

describe('personalized broadcasts', () => {
  it('includes a message per session with correct projection', () => {
    let room = make4WithMembers();
    room = handleStartGame(room, 's1', 100);
    const msgs = personalizedBroadcasts(room);
    expect(msgs).toHaveLength(4);
    for (const { sessionId, msg } of msgs) {
      expect(msg.t).toBe('game');
      if (msg.t !== 'game') throw new Error();
      const viewerId = room.members.find((m) => m.sessionId === sessionId)!.playerId;
      expect(msg.state.viewerId).toBe(viewerId);
      for (const p of msg.state.players) {
        if (p.id === viewerId) expect(p.hand).toBeDefined();
        else expect(p.hand).toBeUndefined();
      }
    }
  });
});

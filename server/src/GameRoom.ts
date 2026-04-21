import type { Env } from './worker';
import type { ClientMessage, ServerMessage } from '../../src/game/protocol';
import {
  emptyRoom,
  handleBeginTurn,
  handleCreate,
  handleDisconnect,
  handleFinalizeResolution,
  handleGuess,
  handleJoin,
  handleLeave,
  handlePlayAgain,
  handleStartGame,
  handleSwapChoice,
  personalizedBroadcasts,
  type RoomSnapshot,
} from '../../src/game/room';

interface Attachment {
  sessionId: string;
  name: string;
}

const STORAGE_KEY = 'room';
const ROOM_IDLE_TIMEOUT_MS = 1000 * 60 * 30; // 30 minutes of total inactivity

export class GameRoom {
  private state: DurableObjectState;
  private env: Env;
  private room: RoomSnapshot | null = null;
  private loaded = false;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async load(code: string, playerCount: 4 | 6 = 4): Promise<RoomSnapshot> {
    if (this.room && this.loaded) return this.room;
    const saved = await this.state.storage.get<RoomSnapshot>(STORAGE_KEY);
    this.room = saved ?? emptyRoom(code, playerCount);
    this.loaded = true;
    return this.room;
  }

  private async save(): Promise<void> {
    if (!this.room) return;
    await this.state.storage.put(STORAGE_KEY, this.room);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.pathname.slice('/ws/'.length).toUpperCase();
    const upgrade = request.headers.get('Upgrade')?.toLowerCase();
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    await this.load(code);

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const sessionId =
      url.searchParams.get('sid') ||
      (globalThis.crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10));
    const name = (url.searchParams.get('name') ?? '').slice(0, 24) || 'Player';

    const attach: Attachment = { sessionId, name };
    server.serializeAttachment(attach);

    // Accept with hibernation so the DO can sleep between messages and wake on events.
    this.state.acceptWebSocket(server);

    this.send(server, { t: 'welcome', sessionId });
    // Send current lobby/game state so late joiners see everything.
    await this.syncAll();

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    await this.load('');
    const attach = ws.deserializeAttachment() as Attachment | null;
    if (!attach) return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message));
    } catch {
      return this.send(ws, { t: 'error', code: 'bad_json', message: 'Invalid JSON' });
    }
    try {
      await this.applyMessage(ws, attach, msg);
    } catch (e) {
      this.send(ws, {
        t: 'error',
        code: 'bad_action',
        message: (e as Error).message ?? String(e),
      });
    }
    await this.save();
    await this.syncAll();
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.load('');
    const attach = ws.deserializeAttachment() as Attachment | null;
    if (!attach || !this.room) return;
    this.room = handleDisconnect(this.room, attach.sessionId);
    if (this.room.phase === 'lobby' && this.room.members.length === 0) {
      await this.state.storage.deleteAll();
      this.room = null;
      return;
    }
    await this.save();
    await this.syncAll();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    return this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    await this.load('');
    if (!this.room) return;
    // Reveal-memorize window: finalize the mismatched turn.
    if (
      this.room.phase === 'playing' &&
      this.room.game?.phase === 'turnResolve' &&
      this.room.game.resolveAt !== null &&
      Date.now() >= this.room.game.resolveAt - 50
    ) {
      this.room = handleFinalizeResolution(this.room);
      await this.save();
      await this.syncAll();
      return;
    }
    // Idle cleanup: if everyone has left, tear down the room.
    if (this.room.members.length === 0) {
      await this.state.storage.deleteAll();
      this.room = null;
    }
  }

  private async applyMessage(ws: WebSocket, attach: Attachment, msg: ClientMessage): Promise<void> {
    if (!this.room) return;
    // Update name if provided in hello.
    if (msg.t === 'hello') {
      if (msg.name && msg.name.length <= 24) {
        attach.name = msg.name;
        ws.serializeAttachment(attach);
      }
      return;
    }
    switch (msg.t) {
      case 'create': {
        if (this.room.members.length > 0) {
          // If existing and same session, treat as idempotent.
          const existing = this.room.members.find((m) => m.sessionId === attach.sessionId);
          if (existing) return;
          throw new Error('Room already exists. Use join instead.');
        }
        this.room = handleCreate(emptyRoom(this.room.code, msg.playerCount), attach.sessionId, attach.name, msg.playerCount);
        // Schedule cleanup alarm.
        await this.state.storage.setAlarm(Date.now() + ROOM_IDLE_TIMEOUT_MS);
        break;
      }
      case 'join':
        if (this.room.members.length === 0) {
          throw new Error('Room not found. Ask the host for a valid code.');
        }
        this.room = handleJoin(this.room, attach.sessionId, attach.name);
        break;
      case 'leave':
        this.room = handleLeave(this.room, attach.sessionId);
        break;
      case 'startGame':
        this.room = handleStartGame(this.room, attach.sessionId);
        break;
      case 'swapChoice':
        this.room = handleSwapChoice(this.room, attach.sessionId, {
          cardId: msg.cardId,
          skip: msg.skip,
        });
        break;
      case 'beginTurn':
        this.room = handleBeginTurn(this.room, attach.sessionId);
        break;
      case 'guess':
        this.room = handleGuess(this.room, attach.sessionId, msg.targetPlayerId, msg.which);
        break;
      case 'playAgain':
        this.room = handlePlayAgain(this.room, attach.sessionId);
        break;
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // Connection closing; ignore.
    }
  }

  private async syncAll(): Promise<void> {
    if (!this.room) {
      for (const ws of this.state.getWebSockets()) {
        this.send(ws, { t: 'abandoned', reason: 'Room closed.' });
        try { ws.close(1000, 'room closed'); } catch { /* ignore */ }
      }
      return;
    }
    if (this.room.phase === 'ended') {
      for (const ws of this.state.getWebSockets()) {
        this.send(ws, { t: 'abandoned', reason: 'A player left the game.' });
        try { ws.close(1000, 'abandoned'); } catch { /* ignore */ }
      }
      // Tear down so no further broadcasts fire for this room.
      await this.state.storage.deleteAll();
      this.room = null;
      return;
    }
    const bySession = new Map(
      personalizedBroadcasts(this.room).map((b) => [b.sessionId, b.msg])
    );
    for (const ws of this.state.getWebSockets()) {
      const attach = ws.deserializeAttachment() as Attachment | null;
      if (!attach) continue;
      const msg = bySession.get(attach.sessionId);
      if (msg) this.send(ws, msg);
    }
    // Re-arm the alarm: if a resolve window is open, fire at resolveAt;
    // otherwise keep a long idle-cleanup deadline.
    if (
      this.room.phase === 'playing' &&
      this.room.game?.phase === 'turnResolve' &&
      this.room.game.resolveAt !== null
    ) {
      await this.state.storage.setAlarm(this.room.game.resolveAt);
    } else {
      const existing = await this.state.storage.getAlarm();
      if (!existing) {
        await this.state.storage.setAlarm(Date.now() + ROOM_IDLE_TIMEOUT_MS);
      }
    }
  }
}

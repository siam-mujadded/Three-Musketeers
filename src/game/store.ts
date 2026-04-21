import { create } from 'zustand';
import type { Lobby, ServerMessage } from './protocol';
import type { PublicGameState, WhichCard } from './types';
import { NetClient, saveName } from '../net/client';
import { getServerHttpUrl, getServerWsUrl } from '../net/config';

export type UIScreen = 'home' | 'joining' | 'lobby' | 'game' | 'victory' | 'abandoned';

interface Store {
  screen: UIScreen;
  name: string;
  code: string | null;
  playerId: string | null;
  lobby: Lobby | null;
  game: PublicGameState | null;
  error: string | null;
  info: string | null;
  connecting: boolean;
  connected: boolean;
  net: NetClient | null;

  setName: (name: string) => void;
  goHome: () => void;
  hostGame: (playerCount: 4 | 6) => Promise<void>;
  joinGame: (code: string) => Promise<void>;
  leaveGame: () => void;
  startGame: () => void;
  submitSwap: (choice: { cardId?: string; skip?: boolean }) => void;
  beginTurn: () => void;
  guess: (targetPlayerId: string, which: WhichCard) => void;
  playAgain: () => void;
  clearError: () => void;
}

function onMessage(get: () => Store, set: (p: Partial<Store>) => void, msg: ServerMessage): void {
  switch (msg.t) {
    case 'welcome':
      // Session id confirmed.
      break;
    case 'lobby': {
      const you = msg.you.playerId || findSelf(get().name, msg.lobby);
      const phase = msg.lobby.players.length === msg.lobby.playerCount ? 'lobby' : 'lobby';
      set({
        screen: phase,
        lobby: msg.lobby,
        code: msg.lobby.code,
        playerId: you,
        game: null,
      });
      break;
    }
    case 'game': {
      set({
        screen: msg.state.phase === 'victory' ? 'victory' : 'game',
        lobby: msg.lobby,
        game: msg.state,
        code: msg.lobby.code,
        playerId: msg.state.viewerId,
      });
      break;
    }
    case 'left':
      set({
        screen: 'home',
        lobby: null,
        game: null,
        code: null,
        playerId: null,
      });
      break;
    case 'abandoned':
      set({
        screen: 'abandoned',
        info: msg.reason,
        game: null,
      });
      break;
    case 'error':
      set({ error: msg.message });
      break;
  }
}

function findSelf(name: string, lobby: Lobby): string | null {
  const match = lobby.players.find((p) => p.name === name);
  return match?.id ?? null;
}

function makeClient(get: () => Store, set: (p: Partial<Store>) => void): NetClient {
  const http = getServerHttpUrl();
  const ws = getServerWsUrl();
  return new NetClient({
    serverHttpUrl: http,
    serverWsUrl: ws,
    onMessage: (m) => onMessage(get, set, m),
    onOpen: () => set({ connected: true, connecting: false }),
    onClose: () => set({ connected: false }),
  });
}

export const useGameStore = create<Store>((set, get) => ({
  screen: 'home',
  name: '',
  code: null,
  playerId: null,
  lobby: null,
  game: null,
  error: null,
  info: null,
  connecting: false,
  connected: false,
  net: null,

  setName: (name) => {
    saveName(name);
    set({ name });
  },

  goHome: () => {
    const net = get().net;
    if (net) net.close();
    set({
      screen: 'home',
      code: null,
      lobby: null,
      game: null,
      playerId: null,
      error: null,
      info: null,
      connecting: false,
      connected: false,
      net: null,
    });
  },

  hostGame: async (playerCount) => {
    const name = (get().name || '').trim();
    if (!name) {
      set({ error: 'Please enter your name first.' });
      return;
    }
    let net = get().net;
    if (!net) {
      net = makeClient(get, set);
      set({ net });
    }
    try {
      set({ connecting: true, error: null });
      const code = await net.createRoom();
      net.connect(code, name);
      set({ screen: 'joining', code });
      // Wait for the websocket to open, then send create.
      await waitOpen(net);
      net.send({ t: 'create', playerCount });
    } catch (e) {
      set({ connecting: false, error: (e as Error).message });
    }
  },

  joinGame: async (rawCode) => {
    const name = (get().name || '').trim();
    const code = rawCode.trim().toUpperCase();
    if (!name) {
      set({ error: 'Please enter your name first.' });
      return;
    }
    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      set({ error: 'Invalid room code. Codes are 4 letters/digits.' });
      return;
    }
    let net = get().net;
    if (!net) {
      net = makeClient(get, set);
      set({ net });
    }
    try {
      set({ connecting: true, error: null });
      net.connect(code, name);
      set({ screen: 'joining', code });
      await waitOpen(net);
      net.send({ t: 'join' });
    } catch (e) {
      set({ connecting: false, error: (e as Error).message });
    }
  },

  leaveGame: () => {
    const net = get().net;
    if (net) {
      net.send({ t: 'leave' });
      net.close();
    }
    set({
      screen: 'home',
      code: null,
      lobby: null,
      game: null,
      playerId: null,
      connected: false,
      connecting: false,
      net: null,
    });
  },

  startGame: () => {
    get().net?.send({ t: 'startGame' });
  },
  submitSwap: (choice) => {
    get().net?.send({ t: 'swapChoice', ...choice });
  },
  beginTurn: () => {
    get().net?.send({ t: 'beginTurn' });
  },
  guess: (targetPlayerId, which) => {
    get().net?.send({ t: 'guess', targetPlayerId, which });
  },
  playAgain: () => {
    get().net?.send({ t: 'playAgain' });
  },
  clearError: () => set({ error: null }),
}));

async function waitOpen(net: NetClient, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const anyNet = net as unknown as { ws: WebSocket | null };
      if (anyNet.ws && anyNet.ws.readyState === WebSocket.OPEN) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Connection timeout. Is the server running?'));
      }
    }, 30);
  });
}

import type { ClientMessage, ServerMessage } from '../game/protocol';

const SID_KEY = 'tm.sessionId';
const NAME_KEY = 'tm.name';

// Session ID lives in sessionStorage so every browser tab has its own identity
// (otherwise multiple tabs on the same origin would collide as the "same
// player" and e.g. all show up as the host when joining). sessionStorage still
// persists across reloads within the same tab, so refresh-reconnect keeps
// working.
function ensureSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    // sessionStorage disabled - fall back to a per-load random id.
    return crypto.randomUUID();
  }
}

export function getSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export interface NetClientOptions {
  serverHttpUrl: string; // e.g. https://api.example.com
  serverWsUrl: string; // e.g. wss://api.example.com
  onMessage: (msg: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class NetClient {
  private ws: WebSocket | null = null;
  private opts: NetClientOptions;
  private currentCode: string | null = null;
  private currentName: string = '';
  private sessionId: string;
  private reconnectAttempts = 0;
  private explicitClose = false;

  constructor(opts: NetClientOptions) {
    this.opts = opts;
    this.sessionId = ensureSessionId();
  }

  async createRoom(): Promise<string> {
    const res = await fetch(`${this.opts.serverHttpUrl}/new`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create room');
    const data = (await res.json()) as { code: string };
    return data.code;
  }

  connect(code: string, name: string): void {
    this.currentCode = code;
    this.currentName = name;
    this.explicitClose = false;
    this.openSocket();
  }

  private openSocket(): void {
    if (!this.currentCode) return;
    const url = new URL(`${this.opts.serverWsUrl}/ws/${this.currentCode}`);
    url.searchParams.set('sid', this.sessionId);
    url.searchParams.set('name', this.currentName);
    const ws = new WebSocket(url.toString());
    this.ws = ws;
    ws.onopen = () => {
      this.reconnectAttempts = 0;
      ws.send(JSON.stringify({ t: 'hello', name: this.currentName, sessionId: this.sessionId } satisfies ClientMessage));
      this.opts.onOpen?.();
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as ServerMessage;
        this.opts.onMessage(msg);
      } catch {
        // ignore
      }
    };
    ws.onclose = () => {
      this.ws = null;
      this.opts.onClose?.();
      if (this.explicitClose || !this.currentCode) return;
      const delay = Math.min(5000, 500 * 2 ** this.reconnectAttempts++);
      setTimeout(() => this.openSocket(), delay);
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }

  send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  close(): void {
    this.explicitClose = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.ws = null;
    this.currentCode = null;
  }

  get code(): string | null {
    return this.currentCode;
  }

  get name(): string {
    return this.currentName;
  }
}

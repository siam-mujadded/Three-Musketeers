export { GameRoom } from './GameRoom';

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  ALLOWED_ORIGIN: string;
}

function corsHeaders(env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  };
}

function generateRoomCode(): string {
  // 4-character uppercase alphanumeric, avoiding ambiguous chars.
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const buf = crypto.getRandomValues(new Uint8Array(4));
  for (let i = 0; i < 4; i++) code += alpha[buf[i] % alpha.length];
  return code;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (url.pathname === '/health') {
      return new Response('ok', { headers: corsHeaders(env) });
    }

    if (url.pathname === '/new' && request.method === 'POST') {
      const code = generateRoomCode();
      return new Response(JSON.stringify({ code }), {
        headers: { 'content-type': 'application/json', ...corsHeaders(env) },
      });
    }

    if (url.pathname.startsWith('/ws/')) {
      const code = url.pathname.slice('/ws/'.length).toUpperCase();
      if (!/^[A-Z0-9]{4,8}$/.test(code)) {
        return new Response('Bad room code', { status: 400, headers: corsHeaders(env) });
      }
      const id = env.GAME_ROOM.idFromName(code);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response('Three Musketeers server is up.', {
      headers: { ...corsHeaders(env), 'content-type': 'text/plain' },
    });
  },
};

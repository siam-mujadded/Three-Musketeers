// Server URL resolution:
// - In dev, defaults to http://localhost:8787 (wrangler dev)
// - In prod, set VITE_SERVER_URL (e.g. https://three-musketeers-server.example.workers.dev)

function resolveHttpUrl(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const explicit = env?.VITE_SERVER_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    // Same-origin deployment (e.g. using Cloudflare Pages Functions proxy) - not typical.
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8787';
    }
  }
  // Fallback: expect the caller to configure VITE_SERVER_URL.
  return '';
}

export function getServerHttpUrl(): string {
  return resolveHttpUrl();
}

export function getServerWsUrl(): string {
  const http = getServerHttpUrl();
  if (!http) return '';
  return http.replace(/^http/i, 'ws');
}

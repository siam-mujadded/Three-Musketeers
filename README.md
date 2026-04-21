# Three Musketeers

> *Un pour tous, tous pour un.*
>
> A real-time, browser-based multiplayer card game of deduction, teamwork, and daring guesses, for **4 or 6 players on their own devices**.

[![License: MIT](https://img.shields.io/badge/License-MIT-c9a24a.svg)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/built%20with-Vite-1b2a5b.svg)](https://vitejs.dev)
[![React 18](https://img.shields.io/badge/React-18-1b2a5b.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-1b2a5b.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/backend-Cloudflare%20Workers-f38020.svg)](https://workers.cloudflare.com/)

---

## Live demo

Once deployed, your URLs will look like:

- Frontend (Cloudflare Pages): `https://three-musketeers.pages.dev`
- Frontend (GitHub Pages): `https://<your-github-username>.github.io/three-musketeers/`
- Backend (Cloudflare Worker): `https://three-musketeers-server.<account>.workers.dev`

## Overview

Three Musketeers is a web game inspired by Alexandre Dumas' *Les Trois Mousquetaires*. It is **online multiplayer**: one player **hosts a room**, shares the **4-character invite code** (or invite URL) with friends, and the game **starts automatically** once the required number of players has joined. Each player plays from their own device, watches the table update live, and can **leave at any time**.

Both the frontend and the multiplayer backend run **free of cost with no cold-start delay**:

- The **frontend** is a static SPA served from a CDN edge (Cloudflare Pages or GitHub Pages).
- The **backend** is a Cloudflare **Worker + Durable Object**, which runs at the edge and supports **WebSocket hibernation**. Rooms stay warm while anyone is connected, and the DO instance is charged for real wall-clock time only, so there is no cold start between messages.

## How to play

1. The deck has **36 cards** - ranks **1 to 12**, three copies each.
2. **4 players = 2 teams of 2**; **6 players = 3 teams of 2**. Teammates are seated with one opponent between them.
3. Cards are dealt evenly (9 each for 4 players, 6 each for 6 players). Turn order is **anticlockwise** from the starting player.
4. **Initial swap.** Before the first turn, each team may exchange one card between teammates - each teammate picks on their own device, or presses *Skip*.
5. **Your turn.** You make up to three **guesses**. For each guess:
   - Pick any player at the table (including yourself).
   - Demand their **smallest** or **largest** card.
   - They reveal that card to the whole table.
6. After each guess, the newly revealed rank must match the previous one:
   - Match -> continue to the next guess.
   - Mismatch -> your turn ends and all revealed cards return to their owners.
7. If **all three** revealed cards share the same rank, your team scores **1 point** and those three cards go to the **discard pile**, where they remain visible to everyone for the rest of the game as reference.
8. **Bonus swap.** After a score, each non-scoring team may exchange one card between teammates.
9. The **first team to 4 points wins**. Bonne chance!

### Key rules at a glance

- You may only ask for a player's smallest or largest card - never a specific one.
- You may target yourself with any guess - sometimes a clever option.
- Opponents' hands are fully private; you only see **face-down card counts** plus the public **discard pile**.
- If any player leaves mid-game, the game is **abandoned** for everyone and all players are returned to the home screen.

## Multiplayer architecture

```
+------------------------+         HTTPS/WSS          +---------------------------+
|  Static frontend (SPA) |  <---------------------->  |  Cloudflare Worker        |
|  Cloudflare Pages or   |                            |  /health  /new  /ws/:code |
|  GitHub Pages          |                            |                           |
+------------------------+                            |   +-------------------+   |
                                                      |   |  Durable Object   |   |
                                                      |   |  one per room     |   |
                                                      |   |  (GameRoom)       |   |
                                                      |   |  - lobby state    |   |
                                                      |   |  - game state     |   |
                                                      |   |  - hibernating    |   |
                                                      |   |    WebSockets     |   |
                                                      |   +-------------------+   |
                                                      +---------------------------+
```

- One **Durable Object per room code**, addressed by `GAME_ROOM.idFromName(code)`. All WebSocket connections for a given room land on the same DO, which means no shared state, no pub/sub, no race conditions.
- **WebSocket hibernation**: the DO can go to sleep between messages and wake up on network events, so a room with no activity costs essentially nothing while still being instantly responsive when players interact.
- The room's **pure reducer** lives at [`src/game/room.ts`](src/game/room.ts) so both the server and the unit tests drive the exact same logic.
- Per-client **state projection** (`projectStateForPlayer`) makes sure each player only ever receives their **own** hand over the wire; opponents are represented as card counts only.

### Message protocol

Fully typed in [`src/game/protocol.ts`](src/game/protocol.ts):

| Client -> Server | Server -> Client |
|---|---|
| `hello` (announce name) | `welcome` (session ID) |
| `create` (host, with playerCount) | `lobby` (players, host, readiness) |
| `join` (other players) | `game` (personalized game state) |
| `startGame` (host) | `left` (a player disconnected) |
| `swapChoice` (card or skip) | `abandoned` (room closed) |
| `beginTurn` | `error` (descriptive reason) |
| `guess` (target + smallest/largest) | |
| `playAgain` (host, rematch) | |
| `leave` | |

## Tech stack

### Frontend
- **[Vite](https://vitejs.dev) + [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)** - small, modern, fast HMR.
- **[Zustand](https://github.com/pmndrs/zustand)** (~1 KB) manages the UI state and proxies actions over a WebSocket.
- **[Tailwind CSS](https://tailwindcss.com)** for styling with a custom parchment/gold/royal-blue/burgundy palette.
- **[Framer Motion](https://www.framer.com/motion/)** for card and table animations.
- **Hand-authored SVG cards** - no raster assets, scales crisply to any resolution.

### Backend
- **[Cloudflare Workers](https://workers.cloudflare.com/)** + **[Durable Objects](https://developers.cloudflare.com/durable-objects/)** - one DO per room, WebSocket hibernation enabled.
- **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)** for local dev (`wrangler dev --local`) and deploy.

### Testing
- **[Vitest](https://vitest.dev)** for the pure game engine and room reducer (23 unit tests).
- **Standalone Node integration test** at [`server/test/run-integration.mjs`](server/test/run-integration.mjs) that spawns `wrangler dev`, drives **four WebSocket clients** through host/join/start/swap/guess/leave, and also smoke-tests a 6-player lobby.

## Project structure

```
three-musketeers/
  index.html
  package.json             (frontend)
  vite.config.ts
  tailwind.config.ts
  public/
    favicon.svg
    _redirects             (Cloudflare Pages / Netlify SPA fallback)
    _headers               (cache + security headers)
  src/
    main.tsx
    App.tsx
    styles/index.css
    game/
      types.ts             (Card, Player, GameState, PublicGameState, ...)
      deck.ts              (buildDeck, seeded shuffle, deal)
      rules.ts             (pure game engine + projectStateForPlayer)
      rules.test.ts
      room.ts              (pure room reducer: lobby + game + leave)
      room.test.ts
      protocol.ts          (shared client/server message types)
      store.ts             (Zustand: UI state + network actions)
    net/
      client.ts            (typed WebSocket client, reconnect, session IDs)
      config.ts            (resolve server URL from Vite env)
    components/             (Card, Hand, PlayerSeat, SwapDialog, GuessPanel, ...)
    screens/
      HomeScreen.tsx        (host or join with name + code)
      JoiningScreen.tsx
      LobbyScreen.tsx       (shareable invite link, auto-start)
      GameScreen.tsx
      VictoryScreen.tsx
      AbandonedScreen.tsx
  server/
    package.json
    wrangler.toml           (DO binding, migrations)
    tsconfig.json
    src/
      worker.ts             (HTTP entrypoint, /new, /ws/:code, CORS)
      GameRoom.ts           (Durable Object: WebSocket hibernation + reducer)
    test/
      run-integration.mjs   (4p + 6p e2e via real wrangler + ws clients)
  .github/workflows/
    deploy.yml              (frontend -> GitHub Pages)
    deploy-worker.yml       (backend -> Cloudflare Workers)
```

## Getting started locally

Prerequisites: **Node.js 20+** and npm.

```bash
git clone https://github.com/<you>/three-musketeers.git
cd three-musketeers
npm install
```

### Terminal 1 - backend (Cloudflare Worker)

```bash
cd server
npm install
npm run dev           # wrangler dev --local on http://localhost:8787
```

### Terminal 2 - frontend (Vite)

```bash
# from the repo root
echo VITE_SERVER_URL=http://localhost:8787 > .env.local    # Windows CMD
# or: printf 'VITE_SERVER_URL=http://localhost:8787\n' > .env.local  (Unix)

npm run dev                  # http://localhost:5173
```

Open the frontend in **four browser tabs (or devices on the same LAN)**:

1. Tab 1: click **Host a game**, pick 4 players, share the invite code.
2. Tabs 2-4: click **Join**, paste the code, enter a name.
3. The host clicks **Start game** once the lobby is full.

### Running the tests

```bash
npm test                     # 23 unit tests (rules + room reducer)
npm run build                # production build sanity check

cd server
npm test                     # end-to-end: spawns wrangler and runs 4 + 6 player clients
```

The integration test verifies the full lifecycle: room creation, the 5th joiner being rejected, non-host being blocked from starting, simultaneous game start for all players, **hand privacy** (every player only receives their own cards), the distributed swap phase, turn protection, broadcast consistency, and mid-game leave triggering an abandoned broadcast.

## Deployment (free, zero cold start)

The frontend is a static SPA - served instantly from any CDN edge. The backend is a Cloudflare Worker + Durable Object, which runs at the edge with WebSocket hibernation; you only pay for the tiny slices of wall-clock time you are actively using, and the free plan (100k requests/day, 1 GB DO storage) is more than enough for casual play.

### Backend: Cloudflare Worker (required)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com) (free).
2. Install Wrangler locally if you have not already: `npm i -g wrangler`.
3. From the `server/` directory, log in and deploy:

   ```bash
   cd server
   npx wrangler login
   npx wrangler deploy
   ```

4. Note the public URL printed by Wrangler, e.g. `https://three-musketeers-server.<your-account>.workers.dev`. You will plug this into the frontend as `VITE_SERVER_URL`.

5. (Optional) tighten CORS by setting the allowed origin to your frontend URL:

   ```bash
   npx wrangler secret put ALLOWED_ORIGIN
   # paste e.g. https://three-musketeers.pages.dev
   ```

#### Automated backend deploy via GitHub Actions

The repo ships [`.github/workflows/deploy-worker.yml`](.github/workflows/deploy-worker.yml). To enable it:

1. Create an API token at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) with the **Edit Cloudflare Workers** template.
2. In your GitHub repo: **Settings -> Secrets and variables -> Actions**, add:
   - `CLOUDFLARE_API_TOKEN` (required)
   - `CLOUDFLARE_ACCOUNT_ID` (optional, required only if the token can see multiple accounts)
3. Push to `main`. Changes under `server/` or `src/game/` automatically redeploy the worker.

### Frontend: Cloudflare Pages (recommended)

1. Push the repo to GitHub.
2. Cloudflare dashboard -> **Workers & Pages** -> **Create** -> **Pages** -> **Connect to Git** -> select the repo.
3. Build configuration:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     - `NODE_VERSION` = `20`
     - `VITE_SERVER_URL` = your worker URL (e.g. `https://three-musketeers-server.<account>.workers.dev`)
4. Save. Every push to `main` auto-deploys and every PR gets a preview URL.

The included `public/_redirects` and `public/_headers` configure SPA routing and long-cache asset headers.

### Frontend: GitHub Pages (alternative)

This repo ships [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push to GitHub on `main`.
2. **Settings -> Pages**, set **Source** to **GitHub Actions**.
3. **Settings -> Secrets and variables -> Actions -> Variables** add:
   - `SERVER_URL` = your worker URL (baked into the build as `VITE_SERVER_URL`).
   - (Optional) `VITE_BASE` = `/<repo-name>/`. Defaults to `/three-musketeers/`; use `/` for a custom domain or user/org site.
4. Every push to `main` builds, tests, and deploys the frontend.

## Configuration reference

### Frontend env vars

| Variable | Required | Description |
|---|---|---|
| `VITE_SERVER_URL` | Production | Base URL of the deployed Cloudflare Worker. Example: `https://three-musketeers-server.mycorp.workers.dev`. If not set, the client falls back to `http://localhost:8787`. |
| `VITE_BASE` | Optional | Base path for the SPA (GitHub project pages only). Defaults to `/`. |

### Backend env vars (`server/wrangler.toml` and secrets)

| Variable | Description |
|---|---|
| `ALLOWED_ORIGIN` | CORS allow origin. `"*"` for development; set to your actual frontend URL in production via `wrangler secret put ALLOWED_ORIGIN`. |

## Production checklist

- Set `VITE_SERVER_URL` to the deployed worker URL in your Pages/GitHub Pages environment.
- Set `ALLOWED_ORIGIN` on the worker to your real frontend origin.
- Run `npm test` and `cd server && npm test` before deploying.
- Lighthouse: Performance >= 95, Accessibility >= 95 on mobile.
- Replace `public/favicon.svg` with your preferred crest if desired.

## Roadmap

- Reconnect flow: rejoin an in-progress game if the browser reloads.
- Rule-based AI opponents / bots to fill empty seats.
- Chat channel per room.
- Sound design (card flips, quill-dip, victory fanfare).
- i18n (English / French).
- Accessibility pass (full keyboard play, ARIA announcements).

## Contributing

Issues and pull requests welcome. Please run both `npm test` and `cd server && npm test` before opening a PR. Conventional Commits encouraged.

## Credits

- Game concept as described by the project's designer.
- Typography: [Cinzel](https://fonts.google.com/specimen/Cinzel) and [EB Garamond](https://fonts.google.com/specimen/EB+Garamond), both under the SIL Open Font License.
- Inspired by Alexandre Dumas, *Les Trois Mousquetaires* (1844).

## License

[MIT](LICENSE) - play freely, share widely.

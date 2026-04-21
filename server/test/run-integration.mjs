// Standalone integration test: spawns wrangler dev, drives 4 WebSocket
// clients through a full multiplayer flow, and exits cleanly.
//
// Usage: node test/run-integration.mjs
//
// Exit code 0 on success, 1 on failure.

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import WebSocket from 'ws';

const DEV_PORT = Number(process.env.DEV_PORT || 8799);
const HTTP_URL = `http://127.0.0.1:${DEV_PORT}`;
const WS_URL = `ws://127.0.0.1:${DEV_PORT}`;
const VERBOSE = !!process.env.VERBOSE;

let wrangler = null;
let failed = false;
const failures = [];

function log(...args) {
  console.log('[it]', ...args);
}
function vlog(...args) {
  if (VERBOSE) console.log('[vb]', ...args);
}
function assert(cond, msg) {
  if (!cond) {
    failed = true;
    failures.push(msg);
    console.error('  ASSERT FAIL:', msg);
  }
}

async function waitForHealth(maxMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${HTTP_URL}/health`);
      if (res.ok) return;
    } catch {
      // not ready
    }
    await delay(400);
  }
  throw new Error(`Server did not become healthy within ${maxMs}ms`);
}

async function openClient(code, name) {
  const sid = Math.random().toString(36).slice(2, 14);
  const url = `${WS_URL}/ws/${code}?sid=${sid}&name=${encodeURIComponent(name)}`;
  const ws = new WebSocket(url);
  const listeners = [];
  const buffer = []; // all messages received so far
  const handle = {
    ws,
    name,
    sessionId: null,
    playerId: null,
    lastLobby: null,
    lastGame: null,
    errors: [],
    buffer,
    waitFor: () => Promise.reject(new Error('not connected')),
    send(m) {
      ws.send(JSON.stringify(m));
    },
    close() {
      ws.close();
    },
    clearBuffer() {
      buffer.length = 0;
    },
  };
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    vlog(name, '<<', JSON.stringify(msg).slice(0, 180));
    buffer.push(msg);
    if (msg.t === 'welcome') handle.sessionId = msg.sessionId;
    if (msg.t === 'lobby') {
      handle.lastLobby = msg.lobby;
      handle.playerId = msg.you?.playerId || handle.playerId;
    }
    if (msg.t === 'game') {
      handle.lastLobby = msg.lobby;
      handle.lastGame = msg.state;
      handle.playerId = msg.state.viewerId;
    }
    if (msg.t === 'error') handle.errors.push(msg.message);
    for (const l of [...listeners]) l(msg);
  });
  // waitFor: checks the buffer first, then waits for new messages.
  // Use `sinceIndex` to only consider messages after a given point.
  handle.waitFor = (pred, timeoutMs = 8000, label = '', sinceIndex = 0) =>
    new Promise((resolve, reject) => {
      // 1. Scan existing buffer
      for (let i = sinceIndex; i < buffer.length; i++) {
        if (pred(buffer[i])) {
          resolve(buffer[i]);
          return;
        }
      }
      // 2. Otherwise, listen for new ones
      const timer = setTimeout(() => {
        const idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
        reject(new Error(`Timeout [${name}] ${label}`));
      }, timeoutMs);
      const listener = (msg) => {
        if (pred(msg)) {
          clearTimeout(timer);
          const idx = listeners.indexOf(listener);
          if (idx >= 0) listeners.splice(idx, 1);
          resolve(msg);
        }
      };
      listeners.push(listener);
    });
  // Mark current position so subsequent waitFor() calls ignore old messages.
  handle.mark = () => buffer.length;

  await new Promise((resolve, reject) => {
    ws.once('open', resolve);
    ws.once('error', reject);
  });
  handle.send({ t: 'hello', name });
  await handle.waitFor((m) => m.t === 'welcome', 8000, 'welcome');
  return handle;
}

async function run6PlayerTest() {
  log('--- 6-player test ---');
  const res = await fetch(`${HTTP_URL}/new`, { method: 'POST' });
  const { code } = await res.json();
  log('6-player room code:', code);

  const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank'];
  const clients = [];
  const host6 = await openClient(code, names[0]);
  host6.send({ t: 'create', playerCount: 6 });
  await host6.waitFor((m) => m.t === 'lobby', 8000, 'host6 lobby');
  clients.push(host6);

  for (let i = 1; i < 6; i++) {
    const c = await openClient(code, names[i]);
    c.send({ t: 'join' });
    await c.waitFor((m) => m.t === 'lobby', 8000, `${names[i]} lobby`);
    clients.push(c);
  }
  // Wait for everyone (esp. host) to see the full 6-player lobby.
  await Promise.all(
    clients.map((c) =>
      c.waitFor(
        (m) => m.t === 'lobby' && m.lobby.players.length === 6,
        8000,
        `${c.name} sees 6-player lobby`
      )
    )
  );
  assert(host6.lastLobby.players.length === 6, '6 players in lobby');
  log('All 6 players joined lobby');

  const marks = clients.map((c) => c.mark());
  host6.send({ t: 'startGame' });
  await Promise.all(
    clients.map((c, i) =>
      c.waitFor(
        (m) => m.t === 'game' && m.state.phase === 'initialSwap',
        8000,
        `${c.name} 6p game start`,
        marks[i]
      )
    )
  );
  log('6-player game started for all');

  // Verify 3 teams of 2
  const teamCounts = {};
  for (const p of host6.lastGame.players) {
    teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
  }
  const teams = Object.keys(teamCounts);
  assert(teams.length === 3, `3 teams, got ${teams.length}`);
  assert(Object.values(teamCounts).every((n) => n === 2), 'each team has 2 players');

  // Each player has 6 cards (36 / 6 = 6)
  for (const c of clients) {
    const self = c.lastGame.players.find((p) => p.id === c.playerId);
    assert(self.handCount === 6, `${c.name} has 6 cards, got ${self.handCount}`);
  }

  // Skip all swaps, run through a turn
  const marks2 = clients.map((c) => c.mark());
  for (const c of clients) c.send({ t: 'swapChoice', skip: true });
  await Promise.all(
    clients.map((c, i) =>
      c.waitFor(
        (m) => m.t === 'game' && m.state.phase === 'turnStart',
        10000,
        `${c.name} 6p turnStart`,
        marks2[i]
      )
    )
  );
  log('6-player initial swap resolved - turnStart reached');

  // Clean up: everyone closes
  for (const c of clients) c.close();
  await delay(200);
}

async function runTest() {
  log('--- 4-player test ---');
  log('Creating room via HTTP /new ...');
  const res = await fetch(`${HTTP_URL}/new`, { method: 'POST' });
  const { code } = await res.json();
  log('Got room code:', code);
  assert(/^[A-Z0-9]{4}$/.test(code), 'room code format');

  const host = await openClient(code, 'Athos');
  host.send({ t: 'create', playerCount: 4 });
  await host.waitFor((m) => m.t === 'lobby', 8000, 'host lobby');
  log('Host created room');

  const p2 = await openClient(code, 'Porthos');
  p2.send({ t: 'join' });
  await p2.waitFor((m) => m.t === 'lobby', 8000, 'p2 lobby');
  log('Porthos joined');

  const p3 = await openClient(code, 'Aramis');
  p3.send({ t: 'join' });
  await p3.waitFor((m) => m.t === 'lobby', 8000, 'p3 lobby');
  log('Aramis joined');

  const p4 = await openClient(code, "D'Artagnan");
  p4.send({ t: 'join' });
  await p4.waitFor(
    (m) => m.t === 'lobby' && m.lobby.players.length === 4,
    8000,
    'p4 lobby'
  );
  log("D'Artagnan joined - lobby full");
  const all = [host, p2, p3, p4];

  // 5th joiner is rejected
  const p5 = await openClient(code, 'Spy');
  const markP5 = p5.mark();
  p5.send({ t: 'join' });
  await p5.waitFor(
    (m) => m.t === 'error' && /full/i.test(m.message),
    8000,
    'full rejection',
    markP5
  );
  p5.close();
  log('5th joiner rejected correctly');

  // Non-host cannot start
  const markP2 = p2.mark();
  p2.send({ t: 'startGame' });
  await p2.waitFor(
    (m) => m.t === 'error' && /host/i.test(m.message),
    8000,
    'non-host start rejected',
    markP2
  );
  log('Non-host start rejected correctly');

  // Host starts - mark each client's buffer position first
  const marks1 = all.map((c) => c.mark());
  host.send({ t: 'startGame' });
  await Promise.all(
    all.map((c, i) =>
      c.waitFor(
        (m) => m.t === 'game' && m.state.phase === 'initialSwap',
        8000,
        `${c.name} game start`,
        marks1[i]
      )
    )
  );
  log('Game started for all 4 players');

  // Each player sees only own hand
  for (const c of all) {
    const self = c.lastGame.players.find((p) => p.id === c.playerId);
    assert(self?.hand && Array.isArray(self.hand), `${c.name} has own hand`);
    assert(
      self.hand.length === self.handCount,
      `${c.name} hand size matches count`
    );
    const others = c.lastGame.players.filter((p) => p.id !== c.playerId);
    for (const o of others) {
      assert(
        o.hand === undefined,
        `${c.name} should not see ${o.name} hand`
      );
      assert(
        typeof o.handCount === 'number',
        `${c.name} sees handCount for ${o.name}`
      );
    }
  }
  log('Hand privacy OK');

  // All sessions see same public phase
  const phase = host.lastGame.phase;
  assert(
    all.every((c) => c.lastGame.phase === phase),
    'all see same phase'
  );
  assert(phase === 'initialSwap', `phase is initialSwap, got ${phase}`);

  // Skip all initial swaps
  const marks2 = all.map((c) => c.mark());
  for (const c of all) c.send({ t: 'swapChoice', skip: true });
  await Promise.all(
    all.map((c, i) =>
      c.waitFor(
        (m) => m.t === 'game' && m.state.phase === 'turnStart',
        10000,
        `${c.name} turnStart`,
        marks2[i]
      )
    )
  );
  log('All players skipped initial swap - turnStart reached');

  // Active player begins turn
  const activeId = host.lastGame.activePlayerId;
  const active = all.find((c) => c.playerId === activeId);
  const nonActive = all.find((c) => c.playerId !== activeId);
  log('Active player is', active.name);

  // Non-active cannot beginTurn - mark to ignore earlier errors in buffer
  nonActive.errors = [];
  const markNA = nonActive.mark();
  nonActive.send({ t: 'beginTurn' });
  const naErr = await nonActive.waitFor(
    (m) => m.t === 'error' && /turn|active/i.test(m.message),
    8000,
    'non-active begin rejected',
    markNA
  );
  assert(!!naErr, 'non-active beginTurn rejected');

  const mark3 = active.mark();
  active.send({ t: 'beginTurn' });
  await active.waitFor(
    (m) =>
      m.t === 'game' &&
      ['guess1', 'guess2', 'guess3'].includes(m.state.phase),
    8000,
    'guess phase',
    mark3
  );
  log('Active began turn - now in', active.lastGame.phase);

  // Active makes a guess - wait for all clients to receive the update
  const target = active.lastGame.players.find((p) => p.id !== activeId);
  const marks4 = all.map((c) => c.mark());
  active.send({ t: 'guess', targetPlayerId: target.id, which: 'smallest' });
  await Promise.all(
    all.map((c, i) =>
      c.waitFor(
        (m) => m.t === 'game' && m.state.phase !== 'guess1',
        8000,
        `${c.name} guess result`,
        marks4[i]
      )
    )
  );
  log(
    'Guess applied - new phase:',
    active.lastGame.phase,
    'revealed:',
    (active.lastGame.revealed || []).length
  );

  // All see same phase after guess
  const phases = all.map((c) => c.lastGame.phase);
  assert(new Set(phases).size === 1, `all see same phase after guess: ${phases.join(',')}`);

  // A non-active player leaves - should abandon for everyone
  log('Porthos leaves mid-game (expecting abandon)...');
  const expectedAbandoned = all.filter((c) => c !== p2);
  const marks5 = expectedAbandoned.map((c) => c.mark());
  p2.send({ t: 'leave' });
  await Promise.all(
    expectedAbandoned.map((c, i) =>
      c.waitFor((m) => m.t === 'abandoned', 8000, `${c.name} abandoned`, marks5[i])
    )
  );
  log('All remaining players received abandon signal');

  for (const c of all) c.close();
}

function startWrangler() {
  log('Spawning wrangler dev on port', DEV_PORT, '...');
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  wrangler = spawn(
    cmd,
    [
      'wrangler',
      'dev',
      '--port',
      String(DEV_PORT),
      '--local',
      '--log-level',
      'warn',
    ],
    {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin,
    }
  );
  wrangler.stdout.on('data', (d) => {
    if (VERBOSE) process.stderr.write('[wrangler] ' + d.toString());
  });
  wrangler.stderr.on('data', (d) => {
    if (VERBOSE) process.stderr.write('[wrangler-err] ' + d.toString());
  });
}

async function killWrangler() {
  if (!wrangler || wrangler.killed) return;
  log('Shutting down wrangler...');
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/F', '/T', '/PID', String(wrangler.pid)]);
    } catch (e) {
      wrangler.kill();
    }
  } else {
    wrangler.kill('SIGTERM');
  }
  await delay(500);
}

async function main() {
  startWrangler();
  try {
    await waitForHealth();
    log('Server healthy - starting tests');
    await runTest();
    await run6PlayerTest();
  } catch (e) {
    failed = true;
    failures.push(e?.message || String(e));
    console.error('TEST ERROR:', e);
  } finally {
    await killWrangler();
  }

  if (failed) {
    console.error('\n== INTEGRATION TEST FAILED ==');
    for (const f of failures) console.error(' -', f);
    process.exit(1);
  } else {
    console.log('\n== INTEGRATION TEST PASSED ==');
    process.exit(0);
  }
}

main();

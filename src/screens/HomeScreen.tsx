import { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';
import { getSavedName } from '../net/client';

export function HomeScreen() {
  const name = useGameStore((s) => s.name);
  const setName = useGameStore((s) => s.setName);
  const hostGame = useGameStore((s) => s.hostGame);
  const joinGame = useGameStore((s) => s.joinGame);
  const error = useGameStore((s) => s.error);
  const clearError = useGameStore((s) => s.clearError);
  const connecting = useGameStore((s) => s.connecting);

  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'home' | 'host' | 'join'>('home');
  const [playerCount, setPlayerCount] = useState<4 | 6>(4);

  useEffect(() => {
    if (!name) {
      const saved = getSavedName();
      if (saved) setName(saved);
    }
    const url = new URL(window.location.href);
    const c = url.searchParams.get('code') || url.hash.replace('#', '').toUpperCase();
    if (c) {
      setCode(c.toUpperCase());
      setMode('join');
    }
  }, [name, setName]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4">
      <header className="text-center mb-8">
        <h1 className="font-display text-4xl md:text-6xl font-black tracking-widest gold-text">
          THREE MUSKETEERS
        </h1>
        <p className="font-serif italic text-parchment-200 mt-2">
          Un pour tous, tous pour un.
        </p>
        <p className="font-serif text-parchment-300/80 text-sm mt-1 max-w-xl mx-auto">
          A 4 or 6 player online card game of deduction, teamwork, and daring guesses.
        </p>
      </header>

      <section className="panel p-6 md:p-8 w-full max-w-md">
        <label className="block mb-4">
          <span className="font-display text-xs tracking-widest gold-text">YOUR NAME</span>
          <input
            className="input-field w-full mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="e.g. Athos"
            autoFocus
          />
        </label>

        {mode === 'home' && (
          <div className="flex flex-col gap-3">
            <button
              className="btn-primary"
              disabled={!name.trim()}
              onClick={() => setMode('host')}
            >
              Host a new game
            </button>
            <button
              className="btn-ghost"
              disabled={!name.trim()}
              onClick={() => setMode('join')}
            >
              Join with invite code
            </button>
          </div>
        )}

        {mode === 'host' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-display text-xs tracking-widest gold-text mb-2">
                NUMBER OF PLAYERS
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={playerCount === 4}
                  className={`btn-ghost flex-1 ${playerCount === 4 ? 'is-selected' : ''}`}
                  onClick={() => setPlayerCount(4)}
                >
                  4 players (2 teams)
                </button>
                <button
                  type="button"
                  aria-pressed={playerCount === 6}
                  className={`btn-ghost flex-1 ${playerCount === 6 ? 'is-selected' : ''}`}
                  onClick={() => setPlayerCount(6)}
                >
                  6 players (3 teams)
                </button>
              </div>
            </div>
            <button
              className="btn-primary"
              disabled={!name.trim() || connecting}
              onClick={() => hostGame(playerCount)}
            >
              {connecting ? 'Creating room...' : 'Create room'}
            </button>
            <button className="btn-ghost" onClick={() => setMode('home')}>
              Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="font-display text-xs tracking-widest gold-text">
                INVITE CODE
              </span>
              <input
                className="input-field w-full mt-1 tracking-[0.4em] text-center uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="ABCD"
              />
            </label>
            <button
              className="btn-primary"
              disabled={!name.trim() || code.length < 4 || connecting}
              onClick={() => joinGame(code)}
            >
              {connecting ? 'Joining...' : 'Join game'}
            </button>
            <button className="btn-ghost" onClick={() => setMode('home')}>
              Back
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 panel border-burgundy-500 p-3 text-sm font-serif text-parchment-100">
            <div className="flex items-start justify-between gap-2">
              <span>{error}</span>
              <button className="text-xs underline" onClick={clearError}>
                dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="panel p-5 w-full max-w-md mt-6">
        <h2 className="font-display text-sm gold-text tracking-wider mb-2">How to play</h2>
        <ol className="list-decimal list-inside font-serif text-xs text-parchment-100/90 space-y-1">
          <li>Host creates a room, shares the 4-letter code or invite link.</li>
          <li>Others join; teams are auto-paired. Game begins when the room is full.</li>
          <li>Before the first turn, each team may swap one card between teammates.</li>
          <li>On your turn, make up to three guesses asking any player for their smallest or largest card.</li>
          <li>Match three ranks in a row to score. First team to 4 points wins.</li>
        </ol>
      </section>
    </div>
  );
}

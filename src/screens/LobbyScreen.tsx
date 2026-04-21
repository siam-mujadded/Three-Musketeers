import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store';

export function LobbyScreen() {
  const lobby = useGameStore((s) => s.lobby);
  const playerId = useGameStore((s) => s.playerId);
  const startGame = useGameStore((s) => s.startGame);
  const leaveGame = useGameStore((s) => s.leaveGame);
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    if (!lobby) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    return `${origin}?code=${lobby.code}`;
  }, [lobby]);

  if (!lobby) return null;
  const you = lobby.players.find((p) => p.id === playerId);
  const isHost = !!you?.isHost;
  const full = lobby.players.length === lobby.playerCount;

  function copy(value: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4">
      <div className="panel p-6 md:p-8 w-full max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display text-xs tracking-widest gold-text">ROOM CODE</div>
            <div className="font-display text-5xl tracking-[0.4em] text-parchment-100">
              {lobby.code}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-xs tracking-widest gold-text">PLAYERS</div>
            <div className="font-display text-3xl text-parchment-100">
              {lobby.players.length}/{lobby.playerCount}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="btn-ghost flex-1" onClick={() => copy(lobby.code)}>
            Copy code
          </button>
          <button className="btn-ghost flex-1" onClick={() => copy(inviteUrl)}>
            Copy invite link
          </button>
        </div>
        {copied && (
          <div className="font-serif italic text-xs text-parchment-200 mb-2 text-center">
            Copied to clipboard.
          </div>
        )}

        <div className="flex flex-col gap-2 mb-6">
          {lobby.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded px-3 py-2 border border-gold-500/30 bg-royal-900/40"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-burgundy-600'}`}
                />
                <span className="font-display text-parchment-100">{p.name}</span>
                {p.isHost && (
                  <span className="text-[10px] font-display tracking-widest bg-gold-500 text-royal-900 rounded px-1.5 py-0.5 ml-1">
                    HOST
                  </span>
                )}
                {p.id === playerId && (
                  <span className="text-[10px] font-serif italic text-parchment-300 ml-1">
                    (you)
                  </span>
                )}
              </div>
            </div>
          ))}
          {Array.from({ length: lobby.playerCount - lobby.players.length }).map((_, i) => (
            <div
              key={`slot-${i}`}
              className="rounded px-3 py-2 border border-dashed border-gold-500/25 bg-royal-900/20 font-serif italic text-parchment-300/60 text-sm"
            >
              Waiting for player...
            </div>
          ))}
        </div>

        {isHost ? (
          <button className="btn-primary w-full" disabled={!full} onClick={startGame}>
            {full ? 'Deal the cards!' : `Waiting for ${lobby.playerCount - lobby.players.length} more`}
          </button>
        ) : (
          <div className="font-serif italic text-parchment-200 text-center">
            {full
              ? 'Waiting for the host to start the game...'
              : `Share the code so ${lobby.playerCount - lobby.players.length} more can join.`}
          </div>
        )}

        <div className="flex justify-center mt-4">
          <button className="btn-ghost" onClick={leaveGame}>
            Leave lobby
          </button>
        </div>
      </div>
    </div>
  );
}

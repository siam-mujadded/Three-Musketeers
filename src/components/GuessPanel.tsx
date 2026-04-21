import { useEffect, useState } from 'react';
import type { PublicGameState, WhichCard } from '../game/types';
import { useGameStore } from '../game/store';
import { PlayerSeat } from './PlayerSeat';

interface GuessPanelProps {
  state: PublicGameState;
}

function guessNumber(phase: PublicGameState['phase']): 1 | 2 | 3 {
  if (phase === 'guess1') return 1;
  if (phase === 'guess2') return 2;
  return 3;
}

export function GuessPanel({ state }: GuessPanelProps) {
  const doGuess = useGameStore((s) => s.guess);
  const [target, setTarget] = useState<string | null>(null);
  const [which, setWhich] = useState<WhichCard | null>(null);

  const isMyTurn = state.viewerId === state.activePlayerId;
  const n = guessNumber(state.phase);
  const me = state.players.find((p) => p.id === state.viewerId)!;

  useEffect(() => {
    setTarget(null);
    setWhich(null);
  }, [state.phase, state.currentReveals.length]);

  function submit() {
    if (!target || !which) return;
    doGuess(target, which);
  }

  return (
    <div className="panel p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-display tracking-widest text-gold-400 text-[11px]">
          GUESS {n} OF 3
        </div>
        <div className="font-serif text-[11px] text-parchment-300/80">
          {n === 1
            ? 'Pick any player and demand their smallest or largest.'
            : n === 2
              ? "Match the first card's rank to continue."
              : 'Match again to score!'}
        </div>
      </div>

      {!isMyTurn && (
        <div className="font-serif italic text-center text-parchment-200 text-sm py-1">
          {state.players.find((p) => p.id === state.activePlayerId)?.name} is guessing...
        </div>
      )}

      {isMyTurn && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {state.players.map((p) => {
              const team = state.teams.find((t) => t.id === p.teamId)!;
              const empty = p.handCount === 0;
              const teammate = p.teamId === me.teamId && p.id !== me.id;
              return (
                <PlayerSeat
                  key={p.id}
                  player={p}
                  team={team}
                  selectable={!empty}
                  selected={target === p.id}
                  you={p.id === state.viewerId}
                  teammate={teammate}
                  compact
                  onClick={() => !empty && setTarget(p.id)}
                />
              );
            })}
          </div>

          <div className="flex gap-2 items-stretch">
            <button
              className={`btn-ghost flex-1 ${which === 'smallest' ? 'bg-gold-500/20 border-gold-400' : ''}`}
              disabled={!target}
              onClick={() => setWhich('smallest')}
            >
              Smallest
            </button>
            <button
              className={`btn-ghost flex-1 ${which === 'largest' ? 'bg-gold-500/20 border-gold-400' : ''}`}
              disabled={!target}
              onClick={() => setWhich('largest')}
            >
              Largest
            </button>
            <button
              className="btn-primary"
              disabled={!target || !which}
              onClick={submit}
            >
              Reveal
            </button>
          </div>
        </>
      )}
    </div>
  );
}

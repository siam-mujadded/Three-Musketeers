import { useState } from 'react';
import type { PublicGameState } from '../game/types';
import { Hand } from './Hand';
import { useGameStore } from '../game/store';
import { teamMetaFor } from '../game/teamMeta';

interface SwapDialogProps {
  state: PublicGameState;
  title: string;
}

export function SwapDialog({ state, title }: SwapDialogProps) {
  const submitSwap = useGameStore((s) => s.submitSwap);
  const viewerId = state.viewerId;
  const me = state.players.find((p) => p.id === viewerId)!;
  const teamId = me.teamId;

  const pending = state.pendingSwapTeamIds.includes(teamId);
  const myChoice = state.swapChoices[teamId]?.[viewerId];
  const team = state.teams.find((t) => t.id === teamId)!;
  const meta = teamMetaFor(team.id);
  const mateId = team.playerIds.find((id) => id !== viewerId)!;
  const mate = state.players.find((p) => p.id === mateId)!;
  const mateChoice = state.swapChoices[teamId]?.[mateId];

  const [selected, setSelected] = useState<string | null>(null);

  if (!pending) {
    // Wait for other teams to finish.
    return (
      <div className="panel p-5 text-center">
        <div className="font-display tracking-widest text-gold-400 text-xs mb-2">{title}</div>
        <p className="font-serif italic text-parchment-200">
          {state.pendingSwapTeamIds.length === 0
            ? 'Resolving swaps...'
            : 'Waiting for the other team to finish their swap...'}
        </p>
      </div>
    );
  }

  if (myChoice) {
    return (
      <div className="panel p-5 text-center">
        <div className="font-display tracking-widest text-gold-400 text-xs mb-2">{title}</div>
        <p className="font-serif italic text-parchment-200 mb-3">
          You have {myChoice.skip ? 'voted to skip' : 'selected a card'}.
        </p>
        <p className="font-serif text-parchment-300/80 text-sm">
          {mateChoice
            ? 'Resolving the swap...'
            : `Waiting for ${mate.name} to decide...`}
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-display tracking-widest text-gold-400 text-xs">{title}</div>
          <div className="font-serif italic text-parchment-200 text-sm">
            <span style={{ color: meta.secondary }}>{meta.bannerName}</span>: choose one card to offer to{' '}
            <span className="gold-text">{mate.name}</span>, or skip.
          </div>
        </div>
        <button
          className="btn-ghost"
          onClick={() => submitSwap({ skip: true })}
        >
          Skip swap
        </button>
      </div>
      <Hand
        cards={me.hand ?? []}
        selectedId={selected}
        highlightedId={state.lastSwapReceivedCardId[viewerId] ?? null}
        onSelect={(id) => setSelected(id)}
        size="md"
      />
      <div className="flex justify-end mt-3">
        <button
          className="btn-primary"
          disabled={!selected}
          onClick={() => selected && submitSwap({ cardId: selected })}
        >
          Offer this card
        </button>
      </div>
    </div>
  );
}

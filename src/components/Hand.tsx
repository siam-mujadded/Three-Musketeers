import type { Card as CardType } from '../game/types';
import { Card } from './Card';
import { CardBack } from './CardBack';

interface HandProps {
  cards?: CardType[];
  faceDownCount?: number;
  selectedId?: string | null;
  highlightedId?: string | null;
  onSelect?: (id: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function Hand({
  cards,
  faceDownCount,
  selectedId,
  highlightedId,
  onSelect,
  size = 'md',
}: HandProps) {
  if (faceDownCount != null) {
    if (faceDownCount === 0) {
      return (
        <div className="font-serif italic text-parchment-300/70 text-sm">No cards.</div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: faceDownCount }).map((_, i) => (
          <CardBack key={i} size={size} />
        ))}
      </div>
    );
  }
  if (!cards || cards.length === 0) {
    return (
      <div className="font-serif italic text-parchment-300/70 text-sm">No cards in hand.</div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {cards.map((c) => (
        <Card
          key={c.id}
          rank={c.rank}
          size={size}
          selected={selectedId === c.id}
          highlighted={highlightedId === c.id}
          onClick={onSelect ? () => onSelect(c.id) : undefined}
        />
      ))}
    </div>
  );
}

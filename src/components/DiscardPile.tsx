import type { Card as CardType, Rank } from '../game/types';

interface DiscardPileProps {
  discard: CardType[];
  compact?: boolean;
}

const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Shows one chip per rank with a count badge. In compact mode the chips are
 * tiny numeric tiles so the pile fits a single slim strip beneath the table.
 */
export function DiscardPile({ discard, compact = false }: DiscardPileProps) {
  const counts: Record<number, number> = {};
  for (const c of discard) counts[c.rank] = (counts[c.rank] ?? 0) + 1;

  if (compact) {
    return (
      <div className="panel px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <div className="font-display tracking-widest text-gold-400 text-[10px] shrink-0">
            DISCARD · {discard.length}
          </div>
          <div className="flex gap-1 flex-wrap">
            {RANKS.map((r) => {
              const n = counts[r] ?? 0;
              const used = n > 0;
              return (
                <div
                  key={r}
                  className="relative rounded flex items-center justify-center font-display text-[11px] w-7 h-8"
                  style={{
                    background: used
                      ? 'linear-gradient(180deg, #faecc4, #ecd79c)'
                      : 'rgba(10,19,46,0.4)',
                    color: used ? '#1b2a5b' : 'rgba(243,230,196,0.35)',
                    border: `1px solid ${used ? '#c9a24a' : 'rgba(201,162,74,0.3)'}`,
                    opacity: used ? 1 : 0.55,
                  }}
                  title={`Rank ${r}: ${n} of 3 discarded`}
                >
                  {r}
                  {n > 0 && (
                    <span
                      className="absolute -top-1 -right-1 rounded-full font-display text-[9px] w-3.5 h-3.5 flex items-center justify-center border"
                      style={{
                        background: '#5a1825',
                        color: '#f3e6c4',
                        borderColor: '#c9a24a',
                      }}
                    >
                      {n}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel p-3 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="font-display text-xs tracking-widest gold-text">
          DISCARD PILE
        </div>
        <div className="font-serif text-xs text-parchment-300/80">
          {discard.length} card{discard.length === 1 ? '' : 's'} scored
        </div>
      </div>
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {RANKS.map((r) => {
          const n = counts[r] ?? 0;
          return (
            <div
              key={r}
              className="relative rounded flex items-center justify-center font-display text-lg h-16"
              style={{
                background: n > 0
                  ? 'linear-gradient(180deg, #faecc4, #ecd79c)'
                  : 'rgba(10,19,46,0.3)',
                color: n > 0 ? '#1b2a5b' : 'rgba(243,230,196,0.35)',
                border: `1px solid ${n > 0 ? '#c9a24a' : 'rgba(201,162,74,0.3)'}`,
                opacity: n > 0 ? 1 : 0.45,
              }}
            >
              {r}
              {n > 0 && (
                <div
                  className="absolute -top-1 -right-1 bg-burgundy-700 text-parchment-100 text-[10px] font-display tracking-wider rounded-full w-5 h-5 flex items-center justify-center border border-gold-500"
                >
                  {n}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

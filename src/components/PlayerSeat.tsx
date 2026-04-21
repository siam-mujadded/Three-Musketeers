import type { PublicPlayer, Team } from '../game/types';
import { teamMetaFor } from '../game/teamMeta';
import { TeamCrest } from './TeamCrest';

interface PlayerSeatProps {
  player: PublicPlayer;
  team: Team;
  active?: boolean;
  you?: boolean;
  teammate?: boolean;
  connected?: boolean;
  selectable?: boolean;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export function PlayerSeat({
  player,
  team,
  active,
  you,
  teammate,
  connected = true,
  selectable,
  selected,
  compact = false,
  onClick,
}: PlayerSeatProps) {
  const meta = teamMetaFor(team.id);
  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={onClick}
      className={[
        'relative rounded-xl text-left transition-all font-serif text-parchment-100 overflow-hidden',
        compact ? 'min-w-[150px]' : 'min-w-[170px]',
        'border-2',
        active ? 'active-halo' : '',
        selectable ? 'hover:-translate-y-0.5 cursor-pointer' : 'cursor-default',
        selected ? 'ring-2 ring-gold-300 ring-offset-2 ring-offset-burgundy-700' : '',
        connected ? '' : 'opacity-60',
      ].join(' ')}
      style={{
        background: `linear-gradient(180deg, ${meta.primary}f0, ${meta.primary}c0)`,
        borderColor: active ? '#e0b957' : meta.secondary + '55',
        boxShadow: active
          ? `0 0 0 2px ${meta.accent}, 0 0 22px ${meta.accent}88, 0 6px 18px rgba(0,0,0,0.5)`
          : '0 6px 14px rgba(0,0,0,0.45)',
      }}
    >
      {/* Team banner rendered inline at the top so it never overlaps the name. */}
      <div
        className={[
          'w-full text-center font-display uppercase tracking-[0.2em]',
          compact ? 'text-[9px] py-0.5' : 'text-[10px] py-1',
        ].join(' ')}
        style={{
          background: `linear-gradient(180deg, ${meta.secondary}, ${meta.primary})`,
          color: meta.accent,
          borderBottom: `1px solid ${meta.accent}55`,
          letterSpacing: '0.22em',
        }}
      >
        {meta.bannerName}
      </div>

      <div className={compact ? 'flex items-center gap-2 px-2.5 py-1.5' : 'flex items-center gap-2 px-3 py-2'}>
        <TeamCrest emblem={meta.emblem} primary={meta.primary} accent={meta.accent} size={compact ? 22 : 28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className={[
                'font-display truncate',
                compact ? 'text-xs' : 'text-sm',
              ].join(' ')}
            >
              {player.name}
            </span>
            {you && (
              <span className="text-[10px] font-display tracking-wider uppercase text-gold-300">
                you
              </span>
            )}
            {teammate && !you && (
              <span
                className="text-[9px] font-display tracking-wider uppercase px-1 rounded"
                style={{ background: meta.accent, color: meta.primary }}
              >
                teammate
              </span>
            )}
            {!connected && (
              <span className="text-[9px] font-display tracking-wider uppercase text-burgundy-200">
                offline
              </span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-parchment-200/80 mt-0.5">
            {player.handCount} card{player.handCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </button>
  );
}

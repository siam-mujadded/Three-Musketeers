import type { Team, PublicPlayer } from '../game/types';
import { teamMetaFor } from '../game/teamMeta';
import { TeamCrest } from './TeamCrest';

interface ScoreBoardProps {
  teams: Team[];
  players: PublicPlayer[];
  pointsToWin: number;
  scoringTeamId?: string | null;
  yourTeamId?: string | null;
}

export function ScoreBoard({
  teams,
  players,
  pointsToWin,
  scoringTeamId,
  yourTeamId,
}: ScoreBoardProps) {
  return (
    <div className="panel p-3 flex flex-col gap-2 min-w-[220px]">
      <div className="font-display text-xs tracking-widest gold-text">HERALDRY &amp; SCORE</div>
      {teams.map((t) => {
        const meta = teamMetaFor(t.id);
        const names = t.playerIds
          .map((id) => players.find((p) => p.id === id)?.name ?? '?')
          .join(' + ');
        const isScoring = scoringTeamId === t.id;
        const isYours = yourTeamId === t.id;
        return (
          <div
            key={t.id}
            className={[
              'relative rounded-lg px-2.5 py-2 border-2 transition-all',
              isScoring ? 'active-halo' : '',
            ].join(' ')}
            style={{
              background: `linear-gradient(180deg, ${meta.primary}d0, ${meta.primary}90)`,
              borderColor: isScoring
                ? '#e0b957'
                : isYours
                  ? meta.accent
                  : meta.secondary + '55',
            }}
          >
            <div className="flex items-center gap-2">
              <TeamCrest emblem={meta.emblem} primary={meta.primary} accent={meta.accent} size={30} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm text-parchment-50 flex items-center gap-1.5">
                  {meta.bannerName}
                  {isYours && (
                    <span
                      className="text-[9px] font-display tracking-wider uppercase px-1 rounded"
                      style={{ background: meta.accent, color: meta.primary }}
                    >
                      yours
                    </span>
                  )}
                </div>
                <div className="font-serif italic text-[11px] text-parchment-200/90 truncate">
                  {names}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {Array.from({ length: pointsToWin }).map((_, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full border"
                    style={{
                      background: i < t.points ? meta.accent : 'transparent',
                      borderColor: meta.accent + 'b0',
                      boxShadow:
                        i < t.points ? `0 0 6px ${meta.accent}cc` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

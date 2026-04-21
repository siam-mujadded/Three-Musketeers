import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PublicGameState } from '../game/types';
import { PlayerSeat } from './PlayerSeat';
import { Card } from './Card';
import { teamMetaFor } from '../game/teamMeta';
import { TeamCrest } from './TeamCrest';

interface RoundTableProps {
  state: PublicGameState;
}

/**
 * Lays out the players around a circular felt table. The viewer always sits
 * at the bottom; seats fan anticlockwise to match turn order. The center of
 * the table shows the currently revealed cards and the active-turn indicator.
 */
export function RoundTable({ state }: RoundTableProps) {
  const me = state.players.find((p) => p.id === state.viewerId)!;
  const active = state.players.find((p) => p.id === state.activePlayerId)!;
  const n = state.players.length;

  const mySeat = me.seatIndex;
  const rendered = state.players.map((p) => {
    const offset = ((p.seatIndex - mySeat + n) % n);
    // offset 0 = viewer at 6 o'clock (angle = -90deg from east).
    // Anticlockwise increments (so turn order flows leftward).
    const angleDeg = 90 + (offset * 360) / n;
    return { player: p, angleDeg };
  });

  return (
    <div
      className="relative"
      style={{
        // Fit the smaller of available width/height so the circular table is
        // always a full square inside its parent without triggering scroll.
        width: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: '1 / 1',
      }}
    >
      <div className="relative w-full h-full">
        <TableFelt />

        {rendered.map(({ player, angleDeg }) => {
          const team = state.teams.find((t) => t.id === player.teamId)!;
          const you = player.id === me.id;
          const teammate = player.teamId === me.teamId && !you;
          const isActive = player.id === active.id;
          // Position along a 42% radius from the center.
          const rad = (angleDeg * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * 42;
          const y = 50 + Math.sin(rad) * 42;
          return (
            <div
              key={player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <PlayerSeat
                player={player}
                team={team}
                active={isActive}
                you={you}
                teammate={teammate}
                compact
              />
            </div>
          );
        })}

        <TableCenter state={state} />
      </div>
    </div>
  );
}

function TableFelt() {
  return (
    <div className="absolute inset-0 rounded-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, #6b2031 0%, #4a1420 55%, #2c0a11 100%)',
        boxShadow:
          'inset 0 0 0 6px #2a0c12, inset 0 0 0 10px #c9a24a, inset 0 0 0 14px #7a5d1e, inset 0 0 60px rgba(0,0,0,0.55), 0 24px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* subtle radial pattern */}
      <svg className="w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="felt-rays" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10 0 L10 20" stroke="#c9a24a" strokeWidth="0.15" opacity="0.3" />
            <path d="M0 10 L20 10" stroke="#c9a24a" strokeWidth="0.15" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#felt-rays)" />
        {/* Inner decorative ring */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="#c9a24a" strokeWidth="0.4" opacity="0.4" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="#c9a24a" strokeWidth="0.25" opacity="0.3" />
      </svg>
    </div>
  );
}

function TableCenter({ state }: { state: PublicGameState }) {
  const active = state.players.find((p) => p.id === state.activePlayerId)!;
  const isMyTurn = state.viewerId === state.activePlayerId;
  const showReveals = state.currentReveals.length > 0;
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-2 text-center"
      style={{ width: '58%', minHeight: '30%' }}
    >
      {!showReveals && (
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg"
          style={{
            background: 'rgba(10,19,46,0.55)',
            border: '1px solid rgba(201,162,74,0.4)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div className="font-display tracking-widest text-gold-400 text-[10px]">
            {phaseLabel(state)}
          </div>
          <div className="font-serif italic text-parchment-100 text-sm">
            {isMyTurn ? (
              <>
                <span className="gold-text">Your</span> turn.
              </>
            ) : (
              <>
                {active.name}&apos;s turn.
              </>
            )}
          </div>
        </div>
      )}

      {showReveals && <RevealsInCenter state={state} />}
    </div>
  );
}

function phaseLabel(state: PublicGameState): string {
  switch (state.phase) {
    case 'initialSwap':
      return 'INITIAL SWAP';
    case 'postScoreSwap':
      return 'BONUS SWAP';
    case 'turnStart':
      return 'TURN START';
    case 'guess1':
      return 'GUESS 1 OF 3';
    case 'guess2':
      return 'GUESS 2 OF 3';
    case 'guess3':
      return 'GUESS 3 OF 3';
    case 'turnResolve':
      return state.resolveKind === 'score' ? 'TRIO!' : 'MEMORIZE';
    case 'victory':
      return 'VICTORY';
    default:
      return state.phase.toUpperCase();
  }
}

function RevealsInCenter({ state }: { state: PublicGameState }) {
  const isScore = state.phase === 'turnResolve' && state.resolveKind === 'score';
  const scoringTeam = isScore
    ? state.teams.find((t) => t.id === state.scoringTeamId) ?? null
    : null;
  const matchedRank = isScore && state.currentReveals.length > 0
    ? state.currentReveals[0].card.rank
    : null;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 flex-wrap justify-center relative">
        {isScore && <SparkleBurst />}
        <AnimatePresence>
          {state.currentReveals.map((r, i) => {
            const p = state.players.find((pl) => pl.id === r.fromPlayerId);
            return (
              <motion.div
                key={r.card.id}
                initial={{ y: -30, opacity: 0, rotateY: 180, scale: 0.8 }}
                animate={
                  isScore
                    ? {
                        y: [0, -8, 0],
                        opacity: 1,
                        rotateY: 0,
                        scale: [1, 1.08, 1],
                      }
                    : { y: 0, opacity: 1, rotateY: 0, scale: 1 }
                }
                exit={{ y: 20, opacity: 0 }}
                transition={
                  isScore
                    ? { duration: 1.2, delay: i * 0.1, repeat: Infinity, repeatType: 'loop' }
                    : { duration: 0.5, delay: i * 0.08 }
                }
                className="flex flex-col items-center"
              >
                <Card rank={r.card.rank} size="sm" highlighted={isScore} />
                <div
                  className="mt-1 font-serif italic text-[10px] text-parchment-100 px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(10,19,46,0.7)' }}
                >
                  {p?.name} · {r.which}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {state.phase === 'turnResolve' && state.resolveKind === 'mismatch' && (
        <ResolveCountdown
          resolveAt={state.resolveAt}
          label="MISMATCH · MEMORIZE"
          tone="burgundy"
        />
      )}
      {isScore && scoringTeam && (
        <ScoreCelebration teamId={scoringTeam.id} rank={matchedRank} resolveAt={state.resolveAt} />
      )}
    </div>
  );
}

function ResolveCountdown({
  resolveAt,
  label,
  tone,
}: {
  resolveAt: number | null;
  label: string;
  tone: 'burgundy' | 'gold';
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(id);
  }, []);
  if (resolveAt === null) return null;
  const remaining = Math.max(0, resolveAt - now);
  const secs = (remaining / 1000).toFixed(1);
  return (
    <div
      className="px-3 py-1.5 rounded-full font-display tracking-widest text-[11px]"
      style={{
        background: tone === 'gold' ? 'rgba(120,80,10,0.9)' : 'rgba(90,24,37,0.9)',
        color: '#ffd99a',
        border: '1px solid #e0b957',
        boxShadow: '0 0 18px rgba(224,185,87,0.45)',
      }}
    >
      {label} · {secs}s
    </div>
  );
}

function ScoreCelebration({
  teamId,
  rank,
  resolveAt,
}: {
  teamId: string;
  rank: number | null;
  resolveAt: number | null;
}) {
  const meta = teamMetaFor(teamId);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full font-display tracking-[0.22em] uppercase text-[11px]"
        style={{
          background: `linear-gradient(90deg, ${meta.secondary}, ${meta.primary}, ${meta.secondary})`,
          color: meta.accent,
          border: `1px solid ${meta.accent}`,
          boxShadow: `0 0 22px ${meta.accent}aa`,
        }}
      >
        <TeamCrest emblem={meta.emblem} primary={meta.primary} accent={meta.accent} size={18} />
        <span>{meta.bannerName} · Trio of {rank ?? '?'}!</span>
      </div>
      <ResolveCountdown resolveAt={resolveAt} label="DISCARDING" tone="gold" />
    </motion.div>
  );
}

function SparkleBurst() {
  const sparkles = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {sparkles.map((_, i) => {
        const angle = (i / sparkles.length) * Math.PI * 2;
        const dx = Math.cos(angle) * 70;
        const dy = Math.sin(angle) * 55;
        return (
          <motion.span
            key={i}
            className="absolute text-gold-300"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: dx, y: dy, opacity: [0, 1, 0], scale: [0.5, 1.1, 0.6] }}
            transition={{
              duration: 1.4,
              delay: (i % 5) * 0.08,
              repeat: Infinity,
              repeatDelay: 0.1,
            }}
            style={{
              fontSize: 16,
              filter: 'drop-shadow(0 0 6px rgba(224,185,87,0.9))',
            }}
          >
            ✦
          </motion.span>
        );
      })}
    </div>
  );
}

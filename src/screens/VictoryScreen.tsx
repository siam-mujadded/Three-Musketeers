import { motion } from 'framer-motion';
import { useGameStore } from '../game/store';
import { teamMetaFor } from '../game/teamMeta';
import { TeamCrest } from '../components/TeamCrest';

export function VictoryScreen() {
  const state = useGameStore((s) => s.game)!;
  const playAgain = useGameStore((s) => s.playAgain);
  const leaveGame = useGameStore((s) => s.leaveGame);
  const playerId = useGameStore((s) => s.playerId);
  const lobby = useGameStore((s) => s.lobby);

  const winning = state.teams.find((t) => t.id === state.winningTeamId);
  if (!winning) return null;
  const meta = teamMetaFor(winning.id);
  const names = winning.playerIds
    .map((id) => state.players.find((p) => p.id === id)?.name ?? '?')
    .join(' & ');
  const youWon = winning.playerIds.includes(playerId ?? '');
  const isHost = lobby?.players.find((p) => p.id === playerId)?.isHost;

  return (
    <div className="min-h-screen felt flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="panel p-10 max-w-lg text-center"
      >
        <div className="flex justify-center mb-3 animate-shimmer">
          <TeamCrest emblem={meta.emblem} primary={meta.primary} accent={meta.accent} size={140} />
        </div>
        <div className="font-display tracking-widest text-gold-400 text-xs mb-2">
          {youWon ? 'YOUR TEAM WINS' : 'VICTORY'}
        </div>
        <h1 className="font-display text-4xl gold-text mb-2">{meta.bannerName}</h1>
        <p className="font-serif italic text-parchment-200 mb-1">{names}</p>
        <p className="font-serif text-parchment-300/80 text-sm mb-6">
          have reached {state.pointsToWin} points.
        </p>
        <p className="font-serif italic text-parchment-100 mb-6">
          Un pour tous, tous pour un.
        </p>
        <div className="flex flex-col gap-2">
          {isHost && (
            <button className="btn-primary" onClick={playAgain}>
              Play again with same players
            </button>
          )}
          <button className="btn-ghost" onClick={leaveGame}>
            Leave to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

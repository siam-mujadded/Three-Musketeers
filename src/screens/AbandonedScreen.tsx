import { useGameStore } from '../game/store';

export function AbandonedScreen() {
  const info = useGameStore((s) => s.info);
  const goHome = useGameStore((s) => s.goHome);
  return (
    <div className="min-h-screen felt flex items-center justify-center p-6">
      <div className="panel p-10 max-w-md text-center">
        <div className="font-display tracking-widest text-gold-400 text-xs mb-3">
          GAME ENDED
        </div>
        <p className="font-serif text-parchment-100 mb-6">
          {info ?? 'The game has ended.'}
        </p>
        <button className="btn-primary" onClick={goHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}

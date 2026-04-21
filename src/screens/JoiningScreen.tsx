import { useGameStore } from '../game/store';

export function JoiningScreen() {
  const code = useGameStore((s) => s.code);
  const error = useGameStore((s) => s.error);
  const goHome = useGameStore((s) => s.goHome);
  return (
    <div className="min-h-screen felt flex items-center justify-center p-6">
      <div className="panel p-10 max-w-md text-center">
        <div className="font-display tracking-widest text-gold-400 text-xs mb-3">
          CONNECTING
        </div>
        <p className="font-serif text-parchment-100 mb-2">
          Joining room <span className="gold-text font-display">{code ?? '...'}</span>
        </p>
        <p className="font-serif italic text-parchment-300/80 text-sm mb-6">
          Negotiating with the edge server...
        </p>
        {error && (
          <div className="panel border-burgundy-500 p-3 text-sm font-serif text-parchment-100 mb-4">
            {error}
          </div>
        )}
        <button className="btn-ghost" onClick={goHome}>
          Cancel
        </button>
      </div>
    </div>
  );
}

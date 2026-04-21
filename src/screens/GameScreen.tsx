import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/store';
import { ScoreBoard } from '../components/ScoreBoard';
import { DiscardPile } from '../components/DiscardPile';
import { Hand } from '../components/Hand';
import { GuessPanel } from '../components/GuessPanel';
import { SwapDialog } from '../components/SwapDialog';
import { RoundTable } from '../components/RoundTable';
import { teamMetaFor } from '../game/teamMeta';

export function GameScreen() {
  const state = useGameStore((s) => s.game)!;
  const lobby = useGameStore((s) => s.lobby);
  const leaveGame = useGameStore((s) => s.leaveGame);
  const beginTurn = useGameStore((s) => s.beginTurn);
  const [menuOpen, setMenuOpen] = useState(false);

  const me = state.players.find((p) => p.id === state.viewerId)!;
  const myTeam = state.teams.find((t) => t.id === me.teamId)!;
  const myTeamMeta = teamMetaFor(myTeam.id);
  const teammate = state.players.find(
    (p) => p.teamId === me.teamId && p.id !== me.id
  );
  const active = state.players.find((p) => p.id === state.activePlayerId)!;
  const activeTeam = state.teams.find((t) => t.id === active.teamId)!;
  const activeMeta = teamMetaFor(activeTeam.id);
  const isMyTurn = me.id === active.id;

  const connectedByPlayer: Record<string, boolean> = {};
  if (lobby) {
    for (const p of lobby.players) connectedByPlayer[p.id] = p.connected;
  }

  const isSwap =
    state.phase === 'initialSwap' || state.phase === 'postScoreSwap';
  const isGuess =
    state.phase === 'guess1' ||
    state.phase === 'guess2' ||
    state.phase === 'guess3';

  return (
    <div className="felt relative lg:h-screen lg:overflow-hidden flex flex-col min-h-screen">
      {/* Compact top bar */}
      <div className="shrink-0 px-3 md:px-5 py-2 border-b border-gold-500/30 flex items-center justify-between gap-3 bg-black/20">
        <div className="min-w-0 flex items-center gap-3 flex-wrap">
          <div className="font-display tracking-widest text-gold-400 text-[11px] shrink-0">
            ROOM {lobby?.code}
          </div>
          <div className="font-serif italic text-parchment-200 text-sm truncate">
            {isMyTurn ? (
              <>
                It&apos;s <span className="gold-text">your</span> turn.
              </>
            ) : (
              <>
                <span style={{ color: activeMeta.secondary }}>{active.name}</span>{' '}
                is guessing for{' '}
                <span style={{ color: activeMeta.secondary }}>
                  {activeMeta.bannerName}
                </span>
                .
              </>
            )}
          </div>
          <div className="text-[11px] font-serif italic text-parchment-300/80 truncate">
            You fight for{' '}
            <span style={{ color: myTeamMeta.secondary }}>
              {myTeamMeta.bannerName}
            </span>
            {teammate && (
              <>
                {' '}alongside <span className="gold-text">{teammate.name}</span>
              </>
            )}
            .
          </div>
        </div>
        <button className="btn-ghost shrink-0" onClick={() => setMenuOpen(true)}>
          Options
        </button>
      </div>

      {/* Main body: left (table + action strip + discard) | right (score, roster, hand) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-3 p-3">
        <div className="flex flex-col gap-2 min-h-0">
          {/* Circular table fills the available vertical space */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <RoundTable state={state} />
          </div>

          {/* Phase-specific action strip (compact) */}
          {isSwap && (
            <div className="shrink-0 max-h-[36vh] overflow-auto">
              <SwapDialog
                state={state}
                title={
                  state.phase === 'initialSwap'
                    ? 'INITIAL TEAM SWAP'
                    : 'BONUS SWAP AFTER SCORE'
                }
              />
            </div>
          )}

          {state.phase === 'turnStart' && (
            <div className="shrink-0 panel px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-display tracking-widest text-gold-400 text-[10px]">
                  TURN START
                </div>
                <div className="font-serif italic text-parchment-100 text-sm">
                  {isMyTurn
                    ? 'The table is yours, commander.'
                    : `Waiting for ${active.name}...`}
                </div>
              </div>
              {isMyTurn && (
                <button className="btn-primary" onClick={beginTurn}>
                  Begin my turn
                </button>
              )}
            </div>
          )}

          {isGuess && (
            <div className="shrink-0 max-h-[38vh] overflow-auto">
              <GuessPanel state={state} />
            </div>
          )}

          {state.phase === 'turnResolve' && (
            <div
              className="shrink-0 panel px-4 py-2 text-center"
              style={{
                background:
                  state.resolveKind === 'score'
                    ? 'linear-gradient(180deg, rgba(120,80,10,0.9), rgba(40,24,6,0.85))'
                    : 'linear-gradient(180deg, rgba(90,24,37,0.9), rgba(30,8,14,0.85))',
                borderColor: '#e0b957',
              }}
            >
              <span className="font-display tracking-widest text-gold-300 text-[11px] mr-2">
                {state.resolveKind === 'mismatch' ? 'MISMATCH!' : 'POINT SCORED!'}
              </span>
              <span className="font-serif italic text-parchment-100 text-sm">
                {state.resolveKind === 'score'
                  ? 'A trio! Cards will be discarded in a moment.'
                  : 'Memorize the cards — they return to their owners shortly.'}
              </span>
            </div>
          )}

          {/* Discard pile (compact single strip) */}
          <div className="shrink-0">
            <DiscardPile discard={state.discard} compact />
          </div>

          <AnimatePresence>
            {state.lastTurnMessage && state.phase !== 'turnResolve' && (
              <motion.div
                key={state.lastTurnMessage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="shrink-0 panel px-3 py-1.5 font-serif italic text-center text-parchment-200 text-sm"
              >
                {state.lastTurnMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="flex flex-col gap-2 min-h-0">
          <ScoreBoard
            teams={state.teams}
            players={state.players}
            pointsToWin={state.pointsToWin}
            scoringTeamId={state.scoringTeamId}
            yourTeamId={myTeam.id}
          />
          {lobby && (
            <div className="panel p-2.5 text-[11px] font-serif text-parchment-200/90 shrink-0">
              <div className="font-display tracking-widest text-gold-400 text-[10px] mb-1">
                AT THE TABLE
              </div>
              <ul className="space-y-0.5">
                {lobby.players.map((lp) => {
                  const gp = state.players.find((p) => p.id === lp.id);
                  if (!gp) return null;
                  const tm = teamMetaFor(gp.teamId);
                  const isConn = connectedByPlayer[lp.id] ?? true;
                  return (
                    <li key={lp.id} className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: tm.secondary,
                          boxShadow: `0 0 4px ${tm.secondary}`,
                        }}
                      />
                      <span
                        className="truncate"
                        style={{ color: tm.secondary }}
                      >
                        {gp.name}
                      </span>
                      <span className="text-parchment-300/80 truncate">
                        · {tm.bannerName}
                      </span>
                      {!isConn && (
                        <span className="text-burgundy-300 ml-auto text-[9px] tracking-wider uppercase shrink-0">
                          offline
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* YOUR HAND — placed under AT THE TABLE, fills remaining vertical space */}
          <div
            className="panel p-2.5 flex flex-col min-h-0 flex-1"
            style={{
              borderColor: myTeamMeta.accent + 'aa',
              boxShadow: `0 0 0 1px ${myTeamMeta.accent}44, 0 10px 30px rgba(0,0,0,0.35)`,
            }}
          >
            <div className="flex items-center justify-between mb-1.5 shrink-0">
              <div className="font-display tracking-widest text-gold-400 text-[10px] truncate">
                YOUR HAND · {me.hand?.length ?? 0}
              </div>
              <div className="font-serif italic text-parchment-300/70 text-[10px]">
                private
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <Hand
                cards={me.hand ?? []}
                size="sm"
                highlightedId={state.lastSwapReceivedCardId[me.id] ?? null}
              />
            </div>
          </div>
        </aside>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="panel p-6 max-w-sm w-full">
            <div className="font-display tracking-widest text-gold-400 text-xs mb-3 text-center">
              OPTIONS
            </div>
            <div className="flex flex-col gap-3">
              <button className="btn-ghost" onClick={() => setMenuOpen(false)}>
                Back to game
              </button>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(180deg, #a8842f, #5a1825)' }}
                onClick={() => {
                  if (
                    confirm(
                      'Leaving mid-game will abandon the round for everyone. Are you sure?'
                    )
                  ) {
                    leaveGame();
                  }
                }}
              >
                Leave game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

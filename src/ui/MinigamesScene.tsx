import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Gamepad2,
  Lock,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { findCatalogItem, findMinigame, MINIGAMES } from '../content/catalog';
import { soundEngine } from '../core/audio';
import type { AppStateV1 } from '../core/types';
import { CatalogItemArt } from './CatalogArt';
import { FullscreenButton } from './DesignSystem';
import { WorldBackdrop } from './WorldBackdrop';

interface MinigamesSceneProps {
  state: AppStateV1;
  dailyDone: boolean;
  initialGameId?: string | null;
  onBuyItem: (itemId: string) => void;
  onStartDailyAdventure: () => void;
  onOpenShop: () => void;
  onBack: () => void;
}

export const MinigamesScene: React.FC<MinigamesSceneProps> = ({
  state,
  dailyDone,
  initialGameId,
  onBuyItem,
  onStartDailyAdventure,
  onOpenShop,
  onBack,
}) => {
  const coins = state.profile?.coins ?? 0;

  const firstUnlocked = useMemo(
    () => MINIGAMES.find((g) => state.inventory.includes(g.catalogItemId)) ?? MINIGAMES[0],
    [state.inventory]
  );

  const [selectedId, setSelectedId] = useState<string>(() => {
    const requested = findMinigame(initialGameId);
    return requested ? requested.id : firstUnlocked.id;
  });
  const [reloadNonce, setReloadNonce] = useState(0);

  const activeGame = MINIGAMES.find((g) => g.id === selectedId) ?? MINIGAMES[0];
  const isUnlocked = state.inventory.includes(activeGame.catalogItemId);
  const canPlayNow = isUnlocked && dailyDone;
  const catalogItem = findCatalogItem(activeGame.catalogItemId);
  const affordable = coins >= activeGame.price;
  const unlockedCount = MINIGAMES.filter((g) => state.inventory.includes(g.catalogItemId)).length;

  const gameSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return `${normalizedBase}minigames/${activeGame.fileName}`;
  }, [activeGame.fileName]);

  return (
    <div className="h-dvh overflow-hidden relative p-2 sm:p-3.5 short:p-1.5 flex flex-col gap-1.5 sm:gap-2.5 short:gap-1">
      <WorldBackdrop worldId={0} scrimClass="bg-indigo-50/25" />

      {/* Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-indigo-200 px-2.5 sm:px-4 py-1.5 short:py-1 shadow-[0_3px_0_#C7D2FE] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Zurück zur Karte"
          className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Karte</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Gamepad2 className="w-5 h-5 text-indigo-600 shrink-0" />
          <h1 className="text-sm sm:text-lg short:text-xs font-extrabold text-slate-900 truncate">
            Minispiele ({unlockedCount}/{MINIGAMES.length})
          </h1>
          <span
            className={`hidden md:inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-xl border ${
              dailyDone
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {dailyDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tagesaufgabe erledigt</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                <span>Erst Tagesabenteuer</span>
              </>
            )}
          </span>
          <span className="hidden lg:inline-flex items-center gap-1 text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-xl tabular-nums">
            {coins} Goldklötzchen
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canPlayNow && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setReloadNonce((n) => n + 1);
              }}
              title="Spiel neu starten"
              aria-label="Spiel neu starten"
              className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-2.5 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Neu laden</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenShop();
            }}
            className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Laden</span>
          </button>
          <FullscreenButton compact />
        </div>
      </header>

      {/* Game Selector Strip */}
      <nav
        aria-label="Minispiel auswählen"
        className="relative z-10 max-w-6xl w-full mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 shrink-0"
      >
        {MINIGAMES.map((game) => {
          const owned = state.inventory.includes(game.catalogItemId);
          const selected = game.id === activeGame.id;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => {
                soundEngine.playBlockTap();
                setSelectedId(game.id);
              }}
              className={`min-h-[42px] short:min-h-[34px] px-2.5 sm:px-3.5 py-1.5 rounded-xl border-2 font-bold text-xs sm:text-sm short:text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                selected
                  ? 'text-white shadow-[0_3px_0_rgba(15,23,42,0.2)]'
                  : owned
                    ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    : 'bg-white/85 border-slate-200 text-slate-500 hover:bg-white'
              }`}
              style={
                selected
                  ? { backgroundColor: game.accentHex, borderColor: game.accentHex }
                  : undefined
              }
            >
              <span aria-hidden="true">{game.badgeEmoji}</span>
              <span className="whitespace-nowrap">{game.title}</span>
              {!owned ? (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums ${
                    selected
                      ? 'bg-white/25 text-white'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  {game.price}
                </span>
              ) : !dailyDone ? (
                <span
                  title="Heute zuerst Tagesabenteuer abschließen"
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                    selected ? 'bg-white/25 text-white' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  <Compass className="w-3 h-3" />
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Main Stage: Active Game Iframe OR Daily Gate OR Unlock Card */}
      <main className="relative z-10 flex-1 min-h-0 max-w-6xl w-full mx-auto flex flex-col">
        {canPlayNow ? (
          <div className="flex-1 min-h-0 w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-slate-200 bg-white shadow-[0_6px_0_#CBD5E1]">
            <iframe
              key={`${activeGame.id}_${reloadNonce}`}
              src={gameSrc}
              title={activeGame.title}
              className="w-full h-full border-0 block"
              allow="autoplay"
            />
          </div>
        ) : isUnlocked && !dailyDone ? (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex items-center justify-center p-2">
            <div className="w-full max-w-md rounded-3xl bg-white/95 border-2 border-amber-300 p-5 sm:p-6 shadow-[0_6px_0_#F59E0B] text-center space-y-4">
              <div
                className="mx-auto w-20 h-20 rounded-2xl border-2 flex items-center justify-center"
                style={{
                  backgroundColor: activeGame.surfaceHex,
                  borderColor: `${activeGame.accentHex}55`,
                }}
              >
                {catalogItem ? (
                  <CatalogItemArt item={catalogItem} size={60} />
                ) : (
                  <span className="text-4xl">{activeGame.badgeEmoji}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-extrabold">
                  <Compass className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tagesaufgabe noch offen</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Erst dein Tagesabenteuer schaffen!
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong>{activeGame.title}</strong> gehört dir schon! Erledige zuerst dein heutiges{' '}
                  <strong>Tagesabenteuer</strong> (3 kurze Mathe-Runden), dann öffnet sich das Spiel für heute.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccessChime();
                  onStartDailyAdventure();
                }}
                className="w-full min-h-[52px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-sm sm:text-base shadow-[0_4px_0_#D97706] active:translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Compass className="w-5 h-5" />
                <span>Tagesabenteuer jetzt starten!</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex items-center justify-center p-2">
            <div className="w-full max-w-md rounded-3xl bg-white/95 border-2 border-slate-200 p-5 sm:p-6 shadow-[0_6px_0_#CBD5E1] text-center space-y-4">
              <div
                className="mx-auto w-20 h-20 rounded-2xl border-2 flex items-center justify-center"
                style={{
                  backgroundColor: activeGame.surfaceHex,
                  borderColor: `${activeGame.accentHex}55`,
                }}
              >
                {catalogItem ? (
                  <CatalogItemArt item={catalogItem} size={60} />
                ) : (
                  <span className="text-4xl">{activeGame.badgeEmoji}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-extrabold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Noch verschlossen</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">{activeGame.title}</h2>
                <p className="text-sm text-slate-600">{activeGame.subtitle}</p>
              </div>

              <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Deine Goldklötzchen</span>
                  <span className="tabular-nums font-extrabold">
                    {coins} / {activeGame.price}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-amber-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, Math.round((coins / activeGame.price) * 100))}%` }}
                  />
                </div>
              </div>

              {affordable ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playCoinClink();
                    onBuyItem(activeGame.catalogItemId);
                  }}
                  className="w-full min-h-[50px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-sm sm:text-base shadow-[0_4px_0_#D97706] active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {dailyDone
                      ? `Für ${activeGame.price} Goldklötzchen freischalten & spielen!`
                      : `Für ${activeGame.price} Goldklötzchen freischalten`}
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600">
                    Dir fehlen noch {activeGame.price - coins} Goldklötzchen. Löse Mathe-Level oder das Tagesabenteuer!
                  </p>
                  <button
                    type="button"
                    onClick={dailyDone ? onBack : onStartDailyAdventure}
                    className="w-full min-h-[46px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-[0_4px_0_#047857] flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{dailyDone ? 'Goldklötzchen sammeln gehen' : 'Tagesabenteuer starten'}</span>
                  </button>
                </div>
              )}

              {!dailyDone && affordable && (
                <p className="text-[11px] font-semibold text-slate-500">
                  Hinweis: Zum Spielen heute muss außerdem zuerst das Tagesabenteuer erledigt sein.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FlipHorizontal2,
  Footprints,
  Hammer,
  Layers,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { findCatalogItem } from '../content/catalog';
import { soundEngine } from '../core/audio';
import type { AppStateV1, HubPlacement } from '../core/types';
import { CatalogItemArt } from './CatalogArt';
import { FullscreenButton } from './DesignSystem';
import { Mascot } from './Mascot';
import { WorldBackdrop } from './WorldBackdrop';

interface HubSceneProps {
  state: AppStateV1;
  onPlaceItem: (itemId: string, x: number, y: number) => void;
  onRotateAt: (x: number, y: number) => void;
  onRemoveAt: (x: number, y: number) => void;
  onClaimQuest: (questId: string, rewardCoins: number) => void;
  onOpenShop: () => void;
  onBack: () => void;
}

interface BuildQuest {
  id: string;
  title: string;
  goalText: string;
  rewardCoins: number;
  evaluate: (placements: HubPlacement[]) => { done: boolean; progressLabel: string };
}

const BUILD_QUESTS: BuildQuest[] = [
  {
    id: 'quest_garden',
    title: 'Garten-Ecke',
    goalText: 'Baue 3 Wiesenklötze und setze ein Gänseblümchen auf einen davon.',
    rewardCoins: 5,
    evaluate: (placements) => {
      const grassBlocks = placements.filter((p) => p.itemId === 'block_grass');
      const hasFlowerOnGrass = placements.some(
        (p) =>
          p.itemId === 'plant_daisy' &&
          (p.z ?? 0) >= 1 &&
          grassBlocks.some((g) => g.x === p.x && g.y === p.y)
      );
      const countPart = Math.min(3, grassBlocks.length);
      return {
        done: grassBlocks.length >= 3 && hasFlowerOnGrass,
        progressLabel: `${countPart}/3 Wiese${hasFlowerOnGrass ? ' + Blume ✓' : ''}`,
      };
    },
  },
  {
    id: 'quest_tower',
    title: 'Wachturm bauen',
    goalText: 'Staple 3 Bausteine übereinander auf ein einziges Feld!',
    rewardCoins: 6,
    evaluate: (placements) => {
      const countsByCell = new Map<string, number>();
      for (const p of placements) {
        if (findCatalogItem(p.itemId)?.category === 'baustein') {
          const key = `${p.x}_${p.y}`;
          countsByCell.set(key, (countsByCell.get(key) ?? 0) + 1);
        }
      }
      const maxStack = Math.max(0, ...countsByCell.values());
      return {
        done: maxStack >= 3,
        progressLabel: `Höchster Turm: ${Math.min(3, maxStack)}/3`,
      };
    },
  },
  {
    id: 'quest_pier',
    title: 'Steg am Wasser',
    goalText: 'Setze einen Wasserklotz und einen Holzklotz direkt daneben oder darauf.',
    rewardCoins: 6,
    evaluate: (placements) => {
      const waters = placements.filter((p) => p.itemId === 'block_water');
      const woods = placements.filter((p) => p.itemId === 'block_wood');
      const adjacent = waters.some((w) =>
        woods.some((wd) => Math.abs(w.x - wd.x) + Math.abs(w.y - wd.y) <= 1)
      );
      return {
        done: waters.length >= 1 && woods.length >= 1 && adjacent,
        progressLabel: adjacent ? 'Steg verbunden ✓' : 'Wasser + Holz verbinden',
      };
    },
  },
  {
    id: 'quest_master',
    title: 'Baumeister-Insel',
    goalText: 'Verbaue mindestens 10 Teile aus 4 verschiedenen Sorten auf deiner Insel.',
    rewardCoins: 10,
    evaluate: (placements) => {
      const kinds = new Set(placements.map((p) => p.itemId));
      return {
        done: placements.length >= 10 && kinds.size >= 4,
        progressLabel: `${Math.min(10, placements.length)}/10 Teile · ${Math.min(4, kinds.size)}/4 Sorten`,
      };
    },
  },
];

const COLS = 8;
const ROWS = 4;

export const HubScene: React.FC<HubSceneProps> = ({
  state,
  onPlaceItem,
  onRotateAt,
  onRemoveAt,
  onClaimQuest,
  onOpenShop,
  onBack,
}) => {
  const profile = state.profile!;
  const placeableItems = state.inventory
    .map((id) => findCatalogItem(id))
    .filter((it): it is NonNullable<typeof it> =>
      Boolean(it && !['hat', 'cape', 'backpack', 'hopEffect'].includes(it.category))
    );

  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    placeableItems[0]?.id ?? null
  );
  const [toolMode, setToolMode] = useState<'place' | 'visit' | 'rotate' | 'remove'>('place');
  const [mascotPos, setMascotPos] = useState<{ x: number; y: number }>({ x: 3, y: 2 });
  const [mascotHappy, setMascotHappy] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);

  const stackMap = useMemo(() => {
    const map = new Map<string, HubPlacement[]>();
    for (const p of state.hubPlacements) {
      const key = `${p.x}_${p.y}`;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
      map.set(key, list);
    }
    return map;
  }, [state.hubPlacements]);

  const completedQuests = state.completedBuildQuests ?? [];
  const questStatuses = useMemo(
    () =>
      BUILD_QUESTS.map((q) => {
        const res = q.evaluate(state.hubPlacements);
        const claimed = completedQuests.includes(q.id);
        return { quest: q, ...res, claimed };
      }),
    [state.hubPlacements, completedQuests]
  );

  const readyToClaim = questStatuses.find((q) => q.done && !q.claimed);
  const activeQuest =
    readyToClaim ??
    questStatuses.find((q) => !q.claimed) ??
    questStatuses[questStatuses.length - 1];
  const claimedCount = questStatuses.filter((q) => q.claimed).length;

  const triggerMascotCheer = (x: number, y: number) => {
    setMascotPos({ x, y });
    setMascotHappy(true);
    window.setTimeout(() => setMascotHappy(false), 750);
  };

  const handleTileTap = (x: number, y: number) => {
    if (toolMode === 'visit') {
      const stack = stackMap.get(`${x}_${y}`) ?? [];
      soundEngine.playHopTone(stack.length);
      triggerMascotCheer(x, y);
      return;
    }
    soundEngine.playBlockTap();
    if (toolMode === 'rotate') {
      onRotateAt(x, y);
      return;
    }
    if (toolMode === 'remove') {
      onRemoveAt(x, y);
      return;
    }
    if (selectedItemId) {
      onPlaceItem(selectedItemId, x, y);
      triggerMascotCheer(x, y);
    }
  };

  return (
    <div className="h-dvh overflow-hidden relative p-2 sm:p-3.5 short:p-1.5 flex flex-col gap-1.5 sm:gap-2.5 short:gap-1">
      <WorldBackdrop worldId={0} scrimClass="bg-sky-50/22" />
      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-emerald-200 px-2.5 sm:px-4 py-1.5 short:py-1 shadow-[0_3px_0_#A7F3D0] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Zurück zur Karte"
          className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Karte</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm sm:text-lg short:text-xs font-extrabold text-slate-900 truncate">
            <span className="hidden sm:inline">
              {/[sxzß]$/i.test(profile.animalName)
                ? `${profile.animalName}’ `
                : `${profile.animalName}s `}
            </span>
            Bau-Insel
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full tabular-nums">
            {profile.coins} Goldklötzchen
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playBlockTap();
              setShowQuestsModal(true);
            }}
            className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-2 sm:px-3 py-1 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Bau-Ideen</span>
            <span className="sm:hidden">Ideen</span>
            <span>({claimedCount}/{BUILD_QUESTS.length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-1"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Laden</span>
          </button>

          <FullscreenButton compact />
        </div>
      </header>

      {/* Active Bau-Idee Strip (Compact, Clickable Reward Banner) */}
      {activeQuest && (
        <div className="relative z-10 max-w-6xl w-full mx-auto shrink-0">
          {readyToClaim ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playCoinClink();
                onClaimQuest(readyToClaim.quest.id, readyToClaim.quest.rewardCoins);
              }}
              className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 border-2 border-emerald-700 px-3 sm:px-4 py-1.5 short:py-1 text-white font-extrabold text-xs sm:text-sm shadow-[0_3px_0_#047857] flex items-center justify-between gap-2 animate-pulse"
            >
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Bau-Idee „{readyToClaim.quest.title}“ geschafft!
                </span>
              </span>
              <span className="shrink-0 bg-amber-300 text-amber-950 px-2.5 py-0.5 rounded-xl text-xs font-extrabold">
                +{readyToClaim.quest.rewardCoins} Goldklötzchen holen!
              </span>
            </button>
          ) : (
            <div className="rounded-2xl bg-white/90 border border-emerald-200 px-3 py-1 short:py-0.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-extrabold text-slate-900 shrink-0">
                  {activeQuest.claimed ? 'Alle Bau-Ideen fertig!' : `Idee: ${activeQuest.quest.title}`}
                </span>
                {!activeQuest.claimed && (
                  <span className="text-slate-600 truncate hidden sm:inline">
                    — {activeQuest.quest.goalText}
                  </span>
                )}
              </div>
              <span className="shrink-0 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg tabular-nums">
                {activeQuest.claimed
                  ? 'Freies Bauen!'
                  : `${activeQuest.progressLabel} (+${activeQuest.quest.rewardCoins})`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2.5D Multi-Layer Stacking Block Island Playfield */}
      <main className="relative z-10 flex-1 min-h-0 max-w-6xl w-full mx-auto overflow-y-auto no-scrollbar flex flex-col items-center">
        <div className="my-auto w-full max-w-[min(54rem,calc((100dvh-210px)*1.9))] short:max-w-[min(40rem,calc((100dvh-166px)*1.82))] rounded-2xl sm:rounded-3xl bg-gradient-to-b from-emerald-300 to-emerald-500 border-4 border-emerald-700 p-2 sm:p-4 short:p-1.5 shadow-[0_7px_0_#15803D] short:shadow-[0_4px_0_#15803D] relative pt-4 sm:pt-6 short:pt-2">
          <div
            className="grid gap-1 sm:gap-2 short:gap-1"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: ROWS }).map((_, y) =>
              Array.from({ length: COLS }).map((__, x) => {
                const stack = stackMap.get(`${x}_${y}`) ?? [];
                const isMascotHere = mascotPos.x === x && mascotPos.y === y;
                const stackCount = stack.length;

                return (
                  <button
                    key={`${x}_${y}`}
                    type="button"
                    aria-label={`Feld ${x + 1}-${y + 1}${stackCount > 0 ? ` (${stackCount} Ebenen)` : ''}`}
                    onClick={() => handleTileTap(x, y)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedId = e.dataTransfer.getData('text/plain');
                      if (droppedId) {
                        onPlaceItem(droppedId, x, y);
                        triggerMascotCheer(x, y);
                      }
                    }}
                    className="relative aspect-square rounded-xl sm:rounded-2xl bg-emerald-200/85 hover:bg-emerald-100 border-2 border-emerald-600/45 shadow-[inset_0_-3px_0_rgba(21,128,61,0.28)] flex items-center justify-center transition-colors overflow-visible"
                  >
                    {/* Base shadow when stack exists */}
                    {stackCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 inset-x-2 h-2 rounded-full bg-emerald-900/20 pointer-events-none"
                      />
                    )}

                    {/* Stacked Layers bottom (z=0) to top (z=n) */}
                    {stack.map((layer, idx) => {
                      const item = findCatalogItem(layer.itemId);
                      if (!item) return null;
                      const liftPx = idx * 8;
                      const flipX = layer.rotation % 2 === 1 ? -1 : 1;
                      return (
                        <div
                          key={`${x}_${y}_${idx}_${item.id}`}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-150 [&_svg]:w-7 [&_svg]:h-7 sm:[&_svg]:w-11 sm:[&_svg]:h-11 short:[&_svg]:w-7 short:[&_svg]:h-7"
                          style={{
                            zIndex: 5 + idx,
                            transform: `translateY(${-liftPx}px) scaleX(${flipX})`,
                          }}
                        >
                          <CatalogItemArt
                            item={item}
                            size={48}
                            sway={!state.settings.reducedMotion && idx === stack.length - 1}
                          />
                        </div>
                      );
                    })}

                    {/* Stack Height Badge for 2+ layers */}
                    {stackCount >= 2 && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 right-0.5 z-20 px-1 rounded-md bg-white/90 border border-slate-300 text-[9px] sm:text-[10px] font-extrabold text-slate-700 leading-tight tabular-nums pointer-events-none"
                      >
                        ×{stackCount}
                      </span>
                    )}

                    {/* Animal Mascot standing atop the highest layer */}
                    {isMascotHere && (
                      <div
                        className="absolute inset-x-0 flex justify-center pointer-events-none transition-transform duration-200 [&>div]:!w-7 [&>div]:!h-7 sm:[&>div]:!w-11 sm:[&>div]:!h-11 short:[&>div]:!w-7 short:[&>div]:!h-7"
                        style={{
                          zIndex: 30,
                          top: `${-10 - stackCount * 7}px`,
                        }}
                      >
                        <Mascot
                          animal={profile.animal}
                          mood={mascotHappy ? 'happy' : 'idle'}
                          size={44}
                          reducedMotion={state.settings.reducedMotion}
                          equipped={state.equippedAccessories}
                        />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Tool Modes + Owned Inventory Dock */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-slate-200 p-1.5 sm:p-2 short:p-1 shadow-[0_4px_0_#CBD5E1] flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* 4 Tactile Tools */}
        <div className="flex items-center gap-1 shrink-0 border-r border-slate-200 pr-1.5 sm:pr-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setToolMode('place');
            }}
            title="Bauen & Stapeln"
            className={`min-h-[42px] short:min-h-[34px] px-2 sm:px-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1 ${
              toolMode === 'place'
                ? 'bg-emerald-600 border-emerald-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span className="hidden md:inline">Bauen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setToolMode('visit');
            }}
            title="Tier hüpfen lassen"
            className={`min-h-[42px] short:min-h-[34px] px-2 sm:px-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1 ${
              toolMode === 'visit'
                ? 'bg-purple-600 border-purple-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span className="hidden md:inline">Hüpfen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setToolMode('rotate');
            }}
            title="Umdrehen / Spiegeln"
            className={`min-h-[42px] short:min-h-[34px] px-2 sm:px-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1 ${
              toolMode === 'rotate'
                ? 'bg-blue-600 border-blue-700 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <FlipHorizontal2 className="w-4 h-4" />
            <span className="hidden md:inline">Wenden</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setToolMode('remove');
            }}
            title="Oberstes Teil abnehmen"
            className={`min-h-[42px] short:min-h-[34px] px-2 sm:px-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1 ${
              toolMode === 'remove'
                ? 'bg-amber-500 border-amber-600 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Abnehmen</span>
          </button>
        </div>

        {/* Owned Placeable Items Horizontal Strip */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {placeableItems.map((item) => {
            const active = toolMode === 'place' && selectedItemId === item.id;
            const isBlock = item.category === 'baustein';
            return (
              <button
                key={item.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                  setSelectedItemId(item.id);
                  setToolMode('place');
                }}
                onClick={() => {
                  soundEngine.playBlockTap();
                  setSelectedItemId(item.id);
                  setToolMode('place');
                }}
                className={`min-h-[44px] sm:min-h-[50px] short:min-h-[34px] px-2 sm:px-3 py-1 rounded-xl border-2 flex items-center gap-1.5 shrink-0 transition-all ${
                  active
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CatalogItemArt item={item} size={28} />
                <div className="text-left leading-tight">
                  <span className="block text-xs font-bold text-slate-800 whitespace-nowrap">
                    {item.name}
                  </span>
                  <span className="hidden sm:block text-[10px] font-semibold text-slate-500">
                    {isBlock ? 'Stapelbar (bis 4)' : 'Aufsatz'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </footer>

      {/* Bau-Ideen Overview Modal */}
      {showQuestsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs overflow-y-auto flex flex-col p-3 sm:p-4"
        >
          <div className="my-auto mx-auto w-full max-w-lg rounded-3xl bg-white border-2 border-amber-200 p-4 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-extrabold text-slate-900">Bau-Ideen für deine Insel</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestsModal(false)}
                aria-label="Schließen"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Bausteine lassen sich bis zu <strong>4 Klötzchen hoch</strong> stapeln! Blumen, Fahnen und Häuser setzen sich oben drauf.
            </p>

            <div className="space-y-2">
              {questStatuses.map(({ quest, done, progressLabel, claimed }) => (
                <div
                  key={quest.id}
                  className={`rounded-2xl border-2 p-3 flex items-center justify-between gap-3 ${
                    claimed
                      ? 'bg-emerald-50 border-emerald-300'
                      : done
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-extrabold text-slate-900">{quest.title}</div>
                    <p className="text-xs text-slate-600">{quest.goalText}</p>
                    <p className="text-[11px] font-bold text-emerald-700">{progressLabel}</p>
                  </div>

                  {claimed ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-xl bg-emerald-200 text-emerald-950 text-xs font-extrabold">
                      Erledigt ✓
                    </span>
                  ) : done ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playCoinClink();
                        onClaimQuest(quest.id, quest.rewardCoins);
                      }}
                      className="shrink-0 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-extrabold shadow-[0_2px_0_#D97706]"
                    >
                      +{quest.rewardCoins} holen!
                    </button>
                  ) : (
                    <span className="shrink-0 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-amber-700 text-xs font-bold tabular-nums">
                      +{quest.rewardCoins} Gold
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

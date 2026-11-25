import React, { useEffect, useState } from 'react';
import { FastForward, Puzzle, Sparkles } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import { createRng } from '../core/rng';
import type { AnimalType, AppStateV1 } from '../core/types';
import type { ChestRewardOutcome } from '../rewards/chests';
import { CatalogItemArt, StickerArt } from './CatalogArt';
import { Mascot } from './Mascot';
import { PuzzlePiecePreview } from './PuzzleArt';
import { WorldBackdrop } from './WorldBackdrop';

interface ChestSceneProps {
  animal: AnimalType;
  equipped: AppStateV1['equippedAccessories'];
  outcome: ChestRewardOutcome;
  reducedMotion: boolean;
  continueLabel?: string;
  onContinue: () => void;
}

export const ChestScene: React.FC<ChestSceneProps> = ({
  animal,
  equipped,
  outcome,
  reducedMotion,
  continueLabel = 'Weiter zur Karte',
  onContinue,
}) => {
  const [opened, setOpened] = useState(reducedMotion);
  const [teaser] = useState(() => createRng(Date.now()).pick(STRINGS_DE.feedback.chestOpen));

  const triggerOpenSounds = React.useCallback(() => {
    soundEngine.playChestPop();
    if (outcome.puzzleDrop) {
      window.setTimeout(() => {
        soundEngine.playPuzzlePieceChime(outcome.puzzleDrop?.completedNow ?? false);
      }, 240);
    }
  }, [outcome.puzzleDrop]);

  useEffect(() => {
    if (reducedMotion || opened) return;
    soundEngine.playChestCreak();
    const t = window.setTimeout(() => {
      triggerOpenSounds();
      setOpened(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [reducedMotion, opened, triggerOpenSounds]);

  const tierColors =
    outcome.tier === 'gold'
      ? { box: '#F59E0B', lid: '#FBBF24', rim: '#B45309', name: 'Gold-Truhe' }
      : outcome.tier === 'iron'
        ? { box: '#64748B', lid: '#94A3B8', rim: '#334155', name: 'Eisen-Truhe' }
        : { box: '#B45309', lid: '#D97706', rim: '#78350F', name: 'Holz-Truhe' };

  const hasPuzzle = Boolean(outcome.puzzleDrop);

  return (
    <div className="h-dvh overflow-y-auto no-scrollbar relative p-3 sm:p-4 short:p-2 flex flex-col">
      <WorldBackdrop worldId={0} scrimClass="bg-amber-50/30" />
      <div className="relative z-10 my-auto mx-auto w-full max-w-2xl rounded-3xl bg-white/95 border-2 border-amber-300 shadow-[0_8px_0_#FDE68A] p-4 sm:p-7 short:p-3 flex flex-col items-center text-center gap-3.5 sm:gap-4 short:gap-1.5 overflow-hidden">
        {/* Confetti blocks when opened */}
        {opened && !reducedMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {[
              { x: '10%', y: '14%', c: '#3B82F6' },
              { x: '84%', y: '18%', c: '#E11D48' },
              { x: '22%', y: '78%', c: '#22C55E' },
              { x: '78%', y: '72%', c: '#F59E0B' },
              { x: '48%', y: '10%', c: '#8B5CF6' },
            ].map((cf, i) => (
              <span
                key={i}
                className="absolute w-3.5 h-3.5 rounded-xs animate-bounce"
                style={{ left: cf.x, top: cf.y, backgroundColor: cf.c }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 short:gap-2">
          <div className="[&_svg]:w-14 [&_svg]:h-14 sm:[&_svg]:w-[78px] sm:[&_svg]:h-[78px] short:[&_svg]:w-11 short:[&_svg]:h-11">
            <Mascot
              animal={animal}
              mood={opened ? 'happy' : 'idle'}
              size={78}
              reducedMotion={reducedMotion}
              equipped={equipped}
            />
          </div>
          <div className="text-left">
            <span className="text-xs short:text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              {tierColors.name}
            </span>
            <h1 className="text-lg sm:text-2xl short:text-sm font-extrabold text-slate-900">
              {opened ? 'Juhu! Deine Belohnung!' : teaser}
            </h1>
          </div>
        </div>

        {/* Custom Block Chest + Jumping Sticker & Puzzle Piece Stage */}
        <div className={`relative flex flex-col items-center justify-center ${!opened && !reducedMotion ? 'animate-chest-wobble' : ''}`}>
          {opened && (
            <div className="absolute -inset-6 rounded-full bg-amber-300/40 blur-lg pointer-events-none" />
          )}

          {opened && (outcome.sticker || outcome.item || outcome.puzzleDrop) && (
            <div className={`relative z-20 -mb-3.5 short:-mb-2 flex items-end justify-center gap-2.5 sm:gap-3 ${!reducedMotion ? 'animate-sticker-jump' : ''}`}>
              {(outcome.sticker || outcome.item) && (
                <div className="flex flex-col items-center">
                  <div className="rounded-3xl short:rounded-2xl bg-white border-4 short:border-2 border-amber-400 p-1.5 short:p-1 shadow-[0_8px_20px_rgba(245,158,11,0.35)] short:[&>div]:!w-12 short:[&>div]:!h-12">
                    {outcome.sticker ? (
                      <StickerArt sticker={outcome.sticker} size={70} />
                    ) : outcome.item ? (
                      <CatalogItemArt item={outcome.item} size={70} />
                    ) : null}
                  </div>
                  <span className="mt-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] short:text-[10px] font-extrabold shadow-xs max-w-[140px] truncate">
                    {outcome.sticker ? outcome.sticker.title : outcome.item?.name}
                  </span>
                </div>
              )}

              {outcome.puzzleDrop && (
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl bg-white border-3 border-sky-400 p-1 shadow-[0_8px_18px_rgba(14,165,233,0.3)] short:hidden">
                    <PuzzlePiecePreview
                      puzzle={outcome.puzzleDrop.puzzle}
                      pieceIndex={outcome.puzzleDrop.pieceIndex}
                      width={76}
                    />
                  </div>
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-extrabold shadow-xs flex items-center gap-1">
                    <Puzzle className="w-3 h-3" />
                    <span>
                      Teil {outcome.puzzleDrop.unlockedCount}/{outcome.puzzleDrop.totalCount}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          <svg viewBox="0 0 120 96" className="w-24 h-20 sm:w-28 sm:h-22 short:w-16 short:h-12 relative z-10">
            <rect x="16" y="42" width="88" height="44" rx="10" fill={tierColors.box} stroke={tierColors.rim} strokeWidth="4" />
            <rect
              x="12"
              y={opened ? 8 : 24}
              width="96"
              height="24"
              rx="8"
              fill={tierColors.lid}
              stroke={tierColors.rim}
              strokeWidth="4"
            />
            <rect x="52" y="38" width="16" height="16" rx="4" fill="#FACC15" stroke="#92400E" strokeWidth="3" />
          </svg>
        </div>

        {!opened ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                triggerOpenSounds();
                setOpened(true);
              }}
              className="min-h-[52px] sm:min-h-[56px] short:min-h-[42px] px-6 sm:px-7 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-extrabold text-base shadow-[0_4px_0_#B45309]"
            >
              Jetzt öffnen!
            </button>
            <button
              type="button"
              onClick={() => {
                triggerOpenSounds();
                setOpened(true);
              }}
              className="min-h-[52px] sm:min-h-[56px] short:min-h-[42px] px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-600 font-bold text-sm flex items-center gap-1.5"
            >
              <FastForward className="w-4 h-4" />
              <span>Überspringen</span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-2.5 sm:space-y-3 short:space-y-1.5">
            <div className={`grid grid-cols-1 ${hasPuzzle ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2 sm:gap-2.5 short:gap-1.5`}>
              {/* Coins Bonus */}
              <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-2.5 sm:p-3 short:p-2 flex items-center gap-2.5">
                <span className="w-9 h-9 sm:w-10 sm:h-10 short:w-8 short:h-8 rounded-xl bg-amber-400 border-2 border-amber-600 flex items-center justify-center font-extrabold text-amber-950 text-sm sm:text-base shrink-0">
                  +{outcome.coinsBonus}
                </span>
                <div className="text-left min-w-0">
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">Goldklötzchen</div>
                  <div className="text-[11px] font-semibold text-amber-800 truncate">Für Laden & Insel</div>
                </div>
              </div>

              {/* Sticker or Item */}
              {outcome.sticker ? (
                <div className="rounded-2xl bg-purple-50 border-2 border-purple-300 p-2.5 sm:p-3 short:p-2 flex items-center gap-2.5">
                  <StickerArt sticker={outcome.sticker} size={42} />
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-extrabold text-purple-700 uppercase">Neuer Sticker</div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{outcome.sticker.title}</div>
                  </div>
                </div>
              ) : outcome.item ? (
                <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-2.5 sm:p-3 short:p-2 flex items-center gap-2.5">
                  <CatalogItemArt item={outcome.item} size={42} />
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-extrabold text-emerald-700 uppercase">Neues Bau-Teil</div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{outcome.item.name}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-sky-50 border-2 border-sky-200 p-2.5 sm:p-3 short:p-2 flex items-center gap-2.5">
                  <Sparkles className="w-7 h-7 text-sky-600 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm">Alle Sticker komplett!</div>
                    <div className="text-[11px] text-sky-700">Extra-Goldklötzchen</div>
                  </div>
                </div>
              )}

              {/* Puzzle Piece Drop */}
              {outcome.puzzleDrop && (
                <div className="rounded-2xl bg-sky-50 border-2 border-sky-300 p-2.5 sm:p-3 short:p-2 flex items-center gap-2.5">
                  <PuzzlePiecePreview
                    puzzle={outcome.puzzleDrop.puzzle}
                    pieceIndex={outcome.puzzleDrop.pieceIndex}
                    width={48}
                  />
                  <div className="text-left min-w-0">
                    <div className="text-[10px] font-extrabold text-sky-700 uppercase">
                      Puzzleteil {outcome.puzzleDrop.unlockedCount}/{outcome.puzzleDrop.totalCount}
                    </div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                      {outcome.puzzleDrop.puzzle.title}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {outcome.puzzleDrop?.completedNow && (
              <div className="rounded-2xl bg-sky-100 border-2 border-sky-400 px-4 py-1.5 short:py-1 text-xs sm:text-sm font-extrabold text-sky-950">
                Puzzle-Bild komplett aufgedeckt: {outcome.puzzleDrop.puzzle.title}!
              </div>
            )}

            {outcome.seriesCompletedTitle && (
              <div className="rounded-2xl bg-emerald-100 border-2 border-emerald-400 px-4 py-1.5 short:py-1 text-xs sm:text-sm font-extrabold text-emerald-900">
                Serie komplett: {outcome.seriesCompletedTitle}!
              </div>
            )}

            <button
              type="button"
              onClick={onContinue}
              className="w-full min-h-[52px] sm:min-h-[58px] short:min-h-[40px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base sm:text-lg short:text-sm shadow-[0_5px_0_#047857]"
            >
              {continueLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

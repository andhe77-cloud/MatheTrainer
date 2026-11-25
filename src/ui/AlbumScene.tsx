import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Megaphone, MegaphoneOff, Puzzle, Sparkles } from 'lucide-react';
import {
  ALBUM_SERIES,
  ALL_STICKERS,
  PUZZLE_PICTURES,
  type AlbumSticker,
  type PuzzlePicture,
} from '../content/catalog';
import { soundEngine } from '../core/audio';
import { speakGerman } from '../core/speech';
import type { AppStateV1 } from '../core/types';
import { StickerArt } from './CatalogArt';
import { FullscreenButton } from './DesignSystem';
import { PuzzleGridCard } from './PuzzleArt';
import { WorldBackdrop } from './WorldBackdrop';

interface AlbumSceneProps {
  state: AppStateV1;
  onSelectActiveSeries: (seriesId: string) => void;
  onSelectActivePuzzle: (puzzleId: string) => void;
  onToggleReadAloud: () => void;
  onBack: () => void;
}

export const AlbumScene: React.FC<AlbumSceneProps> = ({
  state,
  onSelectActiveSeries,
  onSelectActivePuzzle,
  onToggleReadAloud,
  onBack,
}) => {
  const [albumTab, setAlbumTab] = useState<'stickers' | 'puzzles'>('stickers');
  const [viewSeriesId, setViewSeriesId] = useState(
    ALBUM_SERIES.some((s) => s.id === state.activeSeriesId) ? state.activeSeriesId : ALBUM_SERIES[0].id
  );
  const [selectedSticker, setSelectedSticker] = useState<AlbumSticker | null>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<PuzzlePicture>(
    () => PUZZLE_PICTURES.find((p) => p.id === state.activePuzzleId) ?? PUZZLE_PICTURES[0]
  );

  const series = ALBUM_SERIES.find((s) => s.id === viewSeriesId) ?? ALBUM_SERIES[0];
  const ownedSet = new Set(state.unlockedStickers);
  const collectedInSeries = series.stickers.filter((st) => ownedSet.has(st.id)).length;

  const unlockedPuzzleMap = state.unlockedPuzzlePieces ?? {};
  const completedPuzzlesCount = PUZZLE_PICTURES.filter(
    (p) => (unlockedPuzzleMap[p.id]?.length ?? 0) >= p.piecesCount
  ).length;
  const totalUnlockedPieces = PUZZLE_PICTURES.reduce(
    (sum, p) => sum + (unlockedPuzzleMap[p.id]?.length ?? 0),
    0
  );
  const totalAllPieces = PUZZLE_PICTURES.reduce((sum, p) => sum + p.piecesCount, 0);

  return (
    <div className="h-dvh overflow-hidden relative p-2.5 sm:p-4 short:p-2 flex flex-col gap-2 sm:gap-2.5 short:gap-1.5">
      <WorldBackdrop worldId={0} scrimClass="bg-purple-50/35" />

      {/* Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 short:py-1 shadow-[0_3px_0_#CBD5E1] flex items-center justify-between gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-3 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Karte</span>
        </button>

        {/* Segmented Tab Switch: Sticker vs Puzzle-Bilder */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setAlbumTab('stickers');
            }}
            className={`min-h-[34px] short:min-h-[28px] px-2.5 sm:px-3.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all ${
              albumTab === 'stickers'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sticker</span>
            <span className="opacity-85 tabular-nums hidden sm:inline">
              ({state.unlockedStickers.length}/{ALL_STICKERS.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              setAlbumTab('puzzles');
            }}
            className={`min-h-[34px] short:min-h-[28px] px-2.5 sm:px-3.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-all ${
              albumTab === 'puzzles'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/70'
            }`}
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>Puzzle-Bilder</span>
            <span className="opacity-85 tabular-nums hidden sm:inline">
              ({completedPuzzlesCount}/{PUZZLE_PICTURES.length})
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleReadAloud}
            aria-label={state.settings.readAloud ? 'Vorlesen ausschalten' : 'Vorlesen einschalten'}
            title={state.settings.readAloud ? 'Vorlesen: An' : 'Vorlesen: Aus'}
            className={`min-h-[40px] short:min-h-[34px] px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 ${
              state.settings.readAloud
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-slate-300 bg-slate-100 text-slate-500'
            }`}
          >
            {state.settings.readAloud ? <Megaphone className="w-4 h-4" /> : <MegaphoneOff className="w-4 h-4" />}
          </button>
          <FullscreenButton compact />
        </div>
      </header>

      {albumTab === 'stickers' ? (
        <>
          {/* Horizontally Scrollable 14 Series Tabs + Active Chest Series Button */}
          <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center gap-2 shrink-0">
            <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {ALBUM_SERIES.map((s) => {
                const count = s.stickers.filter((st) => ownedSet.has(st.id)).length;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setViewSeriesId(s.id);
                      setSelectedSticker(null);
                    }}
                    className={`min-h-[38px] short:min-h-[32px] px-3 py-1 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      viewSeriesId === s.id
                        ? 'text-white border-transparent shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    style={viewSeriesId === s.id ? { backgroundColor: s.accentHex } : undefined}
                  >
                    <span>{s.title}</span>
                    <span className="opacity-85 tabular-nums">
                      ({count}/{s.stickers.length})
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onSelectActiveSeries(series.id);
              }}
              className={`min-h-[38px] short:min-h-[32px] px-3 py-1 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                state.activeSeriesId === series.id
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {state.activeSeriesId === series.id ? 'Aktive Truhen-Serie' : 'Für nächste Truhe wählen'}
              </span>
              <span className="sm:hidden">
                {state.activeSeriesId === series.id ? 'Aktiv' : 'Wählen'}
              </span>
            </button>
          </div>

          {/* Sticker Grid + Fact Card */}
          <main className="relative z-10 flex-1 min-h-0 overflow-hidden max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] gap-3 sm:gap-4 short:gap-2 items-stretch pb-1">
            <div
              className="rounded-3xl border-2 border-slate-200 p-3 sm:p-4 short:p-2 shadow-[0_5px_0_#CBD5E1] overflow-y-auto grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 content-start gap-2 sm:gap-2.5 short:gap-1.5"
              style={{ backgroundColor: series.surfaceHex }}
            >
              {series.stickers.map((st) => {
                const unlocked = ownedSet.has(st.id);
                const active = selectedSticker?.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playBlockTap();
                      setSelectedSticker(st);
                      if (unlocked && state.settings.readAloud) {
                        speakGerman(`${st.title}. ${st.fact}`, true);
                      }
                    }}
                    className={`rounded-2xl border-2 p-2 short:p-1.5 flex flex-col items-center justify-center gap-1 transition-all ${
                      unlocked
                        ? active
                          ? 'bg-white border-blue-600 ring-2 ring-blue-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-white/65 border-dashed border-slate-300'
                    }`}
                  >
                    <StickerArt sticker={st} locked={!unlocked} size={56} />
                    <span className="text-[11px] short:text-[10px] font-extrabold text-slate-800 text-center leading-tight line-clamp-2">
                      {unlocked ? st.title : 'Noch in Truhe'}
                    </span>
                  </button>
                );
              })}
            </div>

            <aside className="bg-white/95 rounded-3xl border-2 border-slate-200 p-4 sm:p-5 short:p-3 shadow-[0_5px_0_#CBD5E1] flex flex-col justify-center items-center text-center gap-2.5">
              {selectedSticker && ownedSet.has(selectedSticker.id) ? (
                <>
                  <StickerArt sticker={selectedSticker} size={92} />
                  <h2 className="text-lg sm:text-xl short:text-base font-extrabold text-slate-900">
                    {selectedSticker.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                    {selectedSticker.fact}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl short:text-xl font-extrabold" style={{ color: series.accentHex }}>
                    {collectedInSeries} / {series.stickers.length}
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{series.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {series.subtitle}. Tippe einen gewonnenen Sticker an, um seinen Wissenssatz zu lesen!
                  </p>
                </>
              )}
            </aside>
          </main>
        </>
      ) : (
        /* Puzzle-Bilder Mode (15 collectible 6-piece pictures) */
        <>
          <div className="relative z-10 max-w-6xl w-full mx-auto bg-white/90 rounded-2xl border border-sky-200 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 shrink-0 text-xs sm:text-sm">
            <span className="font-bold text-slate-700">
              In jeder Truhe steckt ein neues Puzzleteil zum Aufdecken!
            </span>
            <span className="font-extrabold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-xl tabular-nums shrink-0">
              {totalUnlockedPieces}/{totalAllPieces} Teile · {completedPuzzlesCount}/{PUZZLE_PICTURES.length} Bilder
            </span>
          </div>

          <main className="relative z-10 flex-1 min-h-0 overflow-hidden max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-[1.25fr_0.75fr] gap-3 sm:gap-4 short:gap-2 items-stretch pb-1">
            <div className="rounded-3xl bg-sky-50/95 border-2 border-sky-200 p-3 sm:p-4 short:p-2 shadow-[0_5px_0_#BAE6FD] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 content-start gap-2.5 sm:gap-3">
              {PUZZLE_PICTURES.map((pz) => {
                const pieces = unlockedPuzzleMap[pz.id] ?? [];
                const active = selectedPuzzle.id === pz.id;
                const isChestTarget = state.activePuzzleId === pz.id;
                return (
                  <button
                    key={pz.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playBlockTap();
                      setSelectedPuzzle(pz);
                    }}
                    className={`rounded-2xl border-2 p-2 bg-white flex flex-col gap-1.5 text-left transition-all ${
                      active
                        ? 'border-sky-600 ring-2 ring-sky-200 shadow-sm'
                        : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <PuzzleGridCard puzzle={pz} unlockedPieces={pieces} compact />
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-slate-900 truncate">{pz.title}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md tabular-nums shrink-0 ${
                          pieces.length >= pz.piecesCount
                            ? 'bg-emerald-100 text-emerald-800'
                            : isChestTarget
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {pieces.length}/{pz.piecesCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <aside className="bg-white/95 rounded-3xl border-2 border-slate-200 p-3.5 sm:p-5 short:p-3 shadow-[0_5px_0_#CBD5E1] flex flex-col justify-between gap-2.5 overflow-y-auto">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-extrabold">
                    {selectedPuzzle.category}
                  </span>
                  <span className="text-xs font-extrabold text-slate-600 tabular-nums">
                    {(unlockedPuzzleMap[selectedPuzzle.id]?.length ?? 0)} / {selectedPuzzle.piecesCount} Teile
                  </span>
                </div>

                <PuzzleGridCard
                  puzzle={selectedPuzzle}
                  unlockedPieces={unlockedPuzzleMap[selectedPuzzle.id] ?? []}
                />

                <div className="space-y-1 text-center">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{selectedPuzzle.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {(unlockedPuzzleMap[selectedPuzzle.id]?.length ?? 0) >= selectedPuzzle.piecesCount
                      ? selectedPuzzle.description
                      : 'Öffne weitere Schatztruhen nach deinen Leveln, um die verdeckten Puzzleteile aufzudecken!'}
                  </p>
                </div>
              </div>

              {(unlockedPuzzleMap[selectedPuzzle.id]?.length ?? 0) < selectedPuzzle.piecesCount ? (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectActivePuzzle(selectedPuzzle.id);
                  }}
                  className={`min-h-[44px] short:min-h-[36px] w-full px-3 py-2 rounded-2xl border-2 text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                    state.activePuzzleId === selectedPuzzle.id
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-sky-600 hover:bg-sky-500 border-sky-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {state.activePuzzleId === selectedPuzzle.id
                      ? 'Wird in nächster Truhe aufgedeckt'
                      : 'Für nächste Truhe wählen'}
                  </span>
                </button>
              ) : (
                <div className="min-h-[42px] w-full px-3 py-2 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-extrabold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Dieses Bild ist komplett aufgedeckt!</span>
                </div>
              )}
            </aside>
          </main>
        </>
      )}
    </div>
  );
};

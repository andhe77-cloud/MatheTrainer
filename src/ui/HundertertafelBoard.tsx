import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { splitTensOnes } from '../core/speech';
import type { AnimalType, MascotMood } from '../core/types';
import type { MathTask, TaskFieldSpec } from '../tasks/types';
import { getBoardCoords } from '../tasks/world1Hundertertafel';
import { Mascot } from './Mascot';

interface HundertertafelBoardProps {
  task: MathTask;
  animal: AnimalType;
  mascotMood: MascotMood;
  mascotCell: number | null;
  trailCells: number[];
  activeFieldId: string | null;
  filledAnswers: Record<string, number>;
  tapCompleted: boolean;
  showDotView: boolean;
  showLandingBadge: { number: number; word: string } | null;
  reducedMotion: boolean;
  onTapCell?: (num: number) => void;
  onSelectField?: (fieldId: string) => void;
  onSkipHop?: () => void;
}

export const HundertertafelBoard: React.FC<HundertertafelBoardProps> = ({
  task,
  animal,
  mascotMood,
  mascotCell,
  trailCells,
  activeFieldId,
  filledAnswers,
  tapCompleted,
  showDotView,
  showLandingBadge,
  reducedMotion,
  onTapCell,
  onSelectField,
  onSkipHop,
}) => {
  const ctx = task.boardContext;
  if (!ctx) return null;

  const tafelStart = ctx.tafelStart;
  const fieldByCell = new Map<number, TaskFieldSpec>();
  for (const f of task.fields) {
    if (f.row !== undefined && f.col !== undefined) {
      const cellNum = (f.row - 1) * 10 + (f.col - 1) + tafelStart;
      fieldByCell.set(cellNum, f);
    }
  }

  // Decide whether to render full 10x10 board or focused 3x3 cutout (for luecken / nachbar_4 / umgebung_8)
  const isCutout = !!ctx.cutoutRange && (task.type === 'luecken' || task.type === 'nachbar_4' || task.type === 'umgebung_8');
  const rows = isCutout && ctx.cutoutRange
    ? Array.from({ length: ctx.cutoutRange.maxRow - ctx.cutoutRange.minRow + 1 }, (_, i) => ctx.cutoutRange!.minRow + i)
    : Array.from({ length: 10 }, (_, i) => i + 1);
  const cols = isCutout && ctx.cutoutRange
    ? Array.from({ length: ctx.cutoutRange.maxCol - ctx.cutoutRange.minCol + 1 }, (_, i) => ctx.cutoutRange!.minCol + i)
    : Array.from({ length: 10 }, (_, i) => i + 1);

  const trailSet = new Set(trailCells);
  const givenSet = new Set(ctx.givenCells);

  const renderFieldArrow = (arrow?: TaskFieldSpec['arrow']) => {
    if (arrow === 'up') return <ArrowUp className="w-3.5 h-3.5 text-blue-700" />;
    if (arrow === 'down') return <ArrowDown className="w-3.5 h-3.5 text-blue-700" />;
    if (arrow === 'left') return <ArrowLeft className="w-3.5 h-3.5 text-blue-700" />;
    if (arrow === 'right') return <ArrowRight className="w-3.5 h-3.5 text-blue-700" />;
    return null;
  };

  // Render Punktfeld (100er-Punktefeld with 5er/10er structure) when toggled on
  if (showDotView && !isCutout) {
    return (
      <div className="relative bg-white rounded-3xl border-2 border-slate-200 p-3 sm:p-4 short:p-2 shadow-[0_5px_0_#CBD5E1] flex flex-col items-center gap-2 short:gap-1.5">
        <div className="flex items-center justify-between w-full px-1 text-xs font-bold text-slate-600">
          <span>Hunderterfeld (5er- und 10er-Struktur)</span>
          <span className="text-[11px] font-semibold text-slate-500">Blau: 1–5 · Rot: 6–10</span>
        </div>
        <div className="grid grid-cols-10 gap-1 sm:gap-2 short:gap-1 p-2 sm:p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
          {Array.from({ length: 100 }, (_, idx) => {
            const num = idx + tafelStart;
            const { row, col } = getBoardCoords(num, tafelStart);
            const isActiveTarget = mascotCell === num;
            const inTrail = trailSet.has(num);
            const isStart = tapCompleted && ctx.startCell === num;
            const groupBreakX = col === 6 ? 'ml-1 sm:ml-2' : '';
            const groupBreakY = row === 6 ? 'mt-1 sm:mt-2' : '';
            const dotColor = isActiveTarget
              ? 'bg-amber-500 ring-4 ring-amber-200 scale-125'
              : isStart
                ? 'bg-blue-600 ring-2 ring-blue-200'
                : inTrail
                  ? 'bg-emerald-500'
                  : col <= 5
                    ? 'bg-blue-400/85'
                    : 'bg-rose-400/85';

            return (
              <button
                key={num}
                type="button"
                onClick={() => onTapCell?.(num)}
                title={String(num)}
                className={`w-5 h-5 sm:w-7 sm:h-7 short:w-4 short:h-4 rounded-full transition-transform ${dotColor} ${groupBreakX} ${groupBreakY}`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const landingParts = showLandingBadge ? splitTensOnes(showLandingBadge.number) : null;

  return (
    <div
      onClick={mascotMood === 'hop' && onSkipHop ? onSkipHop : undefined}
      className="relative bg-white rounded-3xl border-2 border-slate-200 p-2 sm:p-3.5 short:p-1.5 shadow-[0_5px_0_#CBD5E1] select-none"
    >
      {/* Column Header (1..10 left-to-right) */}
      <div
        className="grid gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 items-center"
        style={{ gridTemplateColumns: `20px repeat(${cols.length}, minmax(0, 1fr))` }}
      >
        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 text-center">Z\S</div>
        {cols.map((c) => (
          <div key={c} className="text-[10px] sm:text-[11px] font-bold text-slate-500 text-center tabular-nums">
            {c}
          </div>
        ))}
      </div>

      {/* Board Rows (Zeile 1 top -> Zeile 10 bottom) */}
      <div className="space-y-0.5 sm:space-y-1 short:space-y-[1px]">
        {rows.map((r) => (
          <div
            key={r}
            className="grid gap-0.5 sm:gap-1 items-center"
            style={{ gridTemplateColumns: `20px repeat(${cols.length}, minmax(0, 1fr))` }}
          >
            {/* Row Header */}
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 text-center tabular-nums">{r}</div>

            {cols.map((c) => {
              const num = (r - 1) * 10 + (c - 1) + tafelStart;
              const field = fieldByCell.get(num);
              const filled = field ? filledAnswers[field.id] : undefined;
              const isStart = ctx.startCell === num;
              const isMascotHere = mascotCell === num;
              const inTrail = trailSet.has(num);
              const isTappedTarget = tapCompleted && ctx.tapTarget === num;

              // Determine cell visibility & text
              let displayText: string | number = num;
              let cellBg = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50';

              if (task.type === 'zeile_spalte' && task.inputMode === 'single_number' && num === ctx.targetCell && !isMascotHere && !showLandingBadge) {
                displayText = '?';
              }

              if (isCutout) {
                if (field) {
                  displayText = filled !== undefined ? filled : '?';
                  if (filled !== undefined) {
                    cellBg = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-extrabold';
                  } else if (activeFieldId === field.id) {
                    cellBg = 'bg-blue-100 border-blue-600 text-blue-900 ring-3 ring-blue-200 font-extrabold';
                  } else {
                    cellBg = 'bg-amber-50 border-amber-400 text-amber-900 font-bold';
                  }
                } else if (givenSet.has(num)) {
                  cellBg = isStart
                    ? 'bg-blue-600 border-blue-700 text-white font-extrabold'
                    : 'bg-white border-slate-300 text-slate-900 font-bold';
                }
              } else {
                // Full 10x10 board
                if (task.type === 'zahl_finden' && !tapCompleted) {
                  // Child searches for number on full board
                  cellBg = 'bg-white border-slate-200 text-slate-800 hover:bg-blue-50 active:scale-95';
                } else if (isTappedTarget) {
                  cellBg = 'bg-emerald-500 border-emerald-600 text-white font-extrabold';
                } else if (isStart) {
                  cellBg = 'bg-blue-600 border-blue-700 text-white font-extrabold';
                } else if (inTrail) {
                  cellBg = 'bg-amber-100 border-amber-400 text-amber-950 font-bold';
                } else if (field && filled !== undefined) {
                  cellBg = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-extrabold';
                }
                // Hide the target neighbor only AFTER child finds and taps tapTarget!
                if (
                  task.type === 'zahl_finden' &&
                  tapCompleted &&
                  field?.expected === num &&
                  filled === undefined &&
                  !isMascotHere
                ) {
                  displayText = '?';
                  cellBg = 'bg-amber-50 border-amber-400 text-amber-900 font-bold';
                }
              }

              const cellSizeClass = isCutout
                ? 'h-14 sm:h-20 short:h-12 min-w-[54px] sm:min-w-[80px] text-lg sm:text-2xl short:text-base rounded-2xl'
                : 'h-7 sm:h-9 short:h-[21px] w-full text-[11px] sm:text-sm short:text-[10px] rounded-md sm:rounded-lg';

              return (
                <button
                  key={num}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.inputMode === 'tap_board_then_number' && !tapCompleted) {
                      onTapCell?.(num);
                      return;
                    }
                    if (field && onSelectField) {
                      onSelectField(field.id);
                    } else if (onTapCell) {
                      onTapCell(num);
                    }
                  }}
                  className={`relative border sm:border-2 flex items-center justify-center tabular-nums font-bold transition-all ${cellSizeClass} ${cellBg}`}
                >
                  {isCutout && isMascotHere ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{displayText}</span>
                      <Mascot
                        animal={animal}
                        mood={mascotMood}
                        size={42}
                        reducedMotion={reducedMotion}
                      />
                    </div>
                  ) : (
                    <>
                      <span className={isMascotHere ? 'opacity-20' : ''}>{displayText}</span>
                      {isCutout && field && filled === undefined && (
                        <span className="absolute top-1 right-1">{renderFieldArrow(field.arrow)}</span>
                      )}
                      {isMascotHere && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <Mascot
                            animal={animal}
                            mood={mascotMood}
                            size={34}
                            reducedMotion={reducedMotion}
                          />
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Landing Zahlwort + 80 + 4 Decomposition Overlay Badge */}
      {showLandingBadge && landingParts && (
        <div className="mt-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="text-lg font-extrabold text-emerald-900 capitalize">
            „{showLandingBadge.word}“
          </span>
          <span aria-hidden="true" className="text-emerald-400">·</span>
          <span className="text-base font-bold tabular-nums">
            {landingParts.tensValue > 0 && (
              <>
                <span className="text-blue-700">{landingParts.tensValue}</span>
                <span className="text-slate-600 mx-1">+</span>
              </>
            )}
            <span className="text-rose-700">{landingParts.onesValue}</span>
            <span className="text-slate-600 mx-1">=</span>
            <span className="text-slate-900">{showLandingBadge.number}</span>
          </span>
        </div>
      )}
    </div>
  );
};

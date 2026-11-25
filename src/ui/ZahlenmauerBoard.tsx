import React from 'react';
import { splitTensOnes } from '../core/speech';
import type { AnimalType, MascotMood } from '../core/types';
import type { MathTask } from '../tasks/types';
import { Mascot } from './Mascot';

interface ZahlenmauerBoardProps {
  task: MathTask;
  animal: AnimalType;
  mascotMood: MascotMood;
  activeFieldId: string | null;
  filledAnswers: Record<string, number>;
  showLandingBadge: { number: number; word: string } | null;
  reducedMotion: boolean;
  onSelectField?: (fieldId: string) => void;
}

export const ZahlenmauerBoard: React.FC<ZahlenmauerBoardProps> = ({
  task,
  animal,
  mascotMood,
  activeFieldId,
  filledAnswers,
  showLandingBadge,
  reducedMotion,
  onSelectField,
}) => {
  const ctx = task.wallContext;
  if (!ctx) return null;

  // Render from top row down to bottom row
  const rowsTopDown = [...ctx.rows].reverse();
  const landingParts = showLandingBadge ? splitTensOnes(showLandingBadge.number) : null;
  const activeBrick = ctx.rows.flat().find((b) => b.id === activeFieldId);

  return (
    <div className="bg-white rounded-3xl border-2 border-purple-200 p-3 sm:p-5 short:p-2.5 shadow-[0_5px_0_#DDD6FE] flex flex-col items-center gap-2.5 short:gap-1.5 select-none">
      {/* Mascot sitting proudly atop the castle wall */}
      <div className="flex items-center gap-2">
        <div className="[&_svg]:w-11 [&_svg]:h-11 sm:[&_svg]:w-14 sm:[&_svg]:h-14 short:[&_svg]:w-9 short:[&_svg]:h-9">
          <Mascot animal={animal} mood={mascotMood} size={56} reducedMotion={reducedMotion} />
        </div>
        <span className="text-xs font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
          Unten + Unten = Stein darüber
        </span>
      </div>

      {/* Pyramid Brick Rows */}
      <div className="w-full flex flex-col items-center gap-1.5 py-1">
        {rowsTopDown.map((row) => (
          <div key={row[0].row} className="flex items-center justify-center gap-1.5 w-full">
            {row.map((brick) => {
              const filled = filledAnswers[brick.id];
              const isActive = activeFieldId === brick.id;
              const isMissing = brick.isMissing;
              const display = !isMissing ? brick.value : filled !== undefined ? filled : '?';
              const isSupportingBrick = Boolean(
                activeBrick &&
                  activeBrick.row > 0 &&
                  brick.row === activeBrick.row - 1 &&
                  (brick.col === activeBrick.col || brick.col === activeBrick.col + 1)
              );

              let brickStyle = isSupportingBrick
                ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-[0_3px_0_#C084FC]'
                : 'bg-slate-100 border-slate-300 text-slate-900 shadow-[0_3px_0_#CBD5E1]';
              if (isMissing) {
                if (filled !== undefined) {
                  brickStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 shadow-[0_3px_0_#10B981]';
                } else if (isActive) {
                  brickStyle =
                    'bg-blue-100 border-blue-600 text-blue-900 ring-3 ring-blue-200 shadow-[0_3px_0_#2563EB]';
                } else {
                  brickStyle = isSupportingBrick
                    ? 'bg-amber-50 border-purple-400 text-amber-900 shadow-[0_3px_0_#C084FC]'
                    : 'bg-amber-50 border-amber-400 text-amber-900 shadow-[0_3px_0_#F59E0B]';
                }
              }

              return (
                <button
                  key={brick.id}
                  type="button"
                  disabled={!isMissing || filled !== undefined}
                  onClick={() => isMissing && filled === undefined && onSelectField?.(brick.id)}
                  className={`min-w-[66px] sm:min-w-[90px] h-12 sm:h-16 short:h-11 rounded-2xl border-2 font-extrabold text-lg sm:text-2xl short:text-base tabular-nums flex items-center justify-center transition-all ${brickStyle}`}
                >
                  {display}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Landing Zahlwort + 80 + 4 Badge */}
      {showLandingBadge && landingParts && (
        <div className="w-full rounded-2xl bg-emerald-50 border-2 border-emerald-300 px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-center">
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

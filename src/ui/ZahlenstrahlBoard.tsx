import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { splitTensOnes } from '../core/speech';
import type { AnimalType, MascotMood } from '../core/types';
import type { MathTask } from '../tasks/types';
import { Mascot } from './Mascot';

interface ZahlenstrahlBoardProps {
  task: MathTask;
  animal: AnimalType;
  mascotMood: MascotMood;
  mascotMark: number | null;
  trailMarks: number[];
  filledAnswers: Record<string, number>;
  showLandingBadge: { number: number; word: string } | null;
  reducedMotion: boolean;
  onTapMark?: (mark: number) => void;
  onSkipHop?: () => void;
}

export const ZahlenstrahlBoard: React.FC<ZahlenstrahlBoardProps> = ({
  task,
  animal,
  mascotMood,
  mascotMark,
  trailMarks,
  filledAnswers,
  showLandingBadge,
  reducedMotion,
  onTapMark,
  onSkipHop,
}) => {
  const ctx = task.numberLineContext;
  const [showHelperRuler, setShowHelperRuler] = useState(false);

  if (!ctx) return null;

  const marks: number[] = [];
  for (let v = ctx.min; v <= ctx.max; v += ctx.step) {
    marks.push(v);
  }
  const span = Math.max(1, ctx.max - ctx.min);
  const toPct = (v: number) => 5 + ((v - ctx.min) / span) * 90;

  const labeledSet = new Set(ctx.labeledMarks);
  const hiddenSet = new Set(ctx.hiddenMarks ?? []);
  const trailSet = new Set(trailMarks);
  const landingParts = showLandingBadge ? splitTensOnes(showLandingBadge.number) : null;

  return (
    <div
      onClick={mascotMood === 'hop' && onSkipHop ? onSkipHop : undefined}
      className="relative bg-white rounded-3xl border-2 border-teal-200 p-3 sm:p-5 short:p-2.5 shadow-[0_5px_0_#99F6E4] select-none flex flex-col gap-2.5 short:gap-1.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wide text-teal-800">
          Zahlenbrücke ({ctx.min} bis {ctx.max} · Schritt {ctx.step})
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowHelperRuler((v) => !v);
          }}
          className={`min-h-[36px] short:min-h-[32px] px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            showHelperRuler
              ? 'bg-teal-50 border-teal-500 text-teal-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
          <span>{showHelperRuler ? 'Hilfe aus' : 'Alle Zahlen zeigen'}</span>
        </button>
      </div>

      {/* Sky + Bridge Deck + Water */}
      <div className="relative rounded-2xl bg-gradient-to-b from-sky-50 via-sky-100/70 to-cyan-200/70 border-2 border-sky-200 pt-12 sm:pt-14 short:pt-10 pb-5 sm:pb-6 short:pb-4 px-2 overflow-hidden">
        {/* Hop Arcs */}
        <svg viewBox="0 0 100 22" preserveAspectRatio="none" className="w-full h-10 pointer-events-none">
          {ctx.betweenPair && (
            <path
              d={`M ${toPct(ctx.betweenPair[0])} 20 Q ${(toPct(ctx.betweenPair[0]) + toPct(ctx.betweenPair[1])) / 2} 2 ${toPct(ctx.betweenPair[1])} 20`}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="0.9"
              strokeDasharray="1.5 1.5"
            />
          )}
          {trailMarks.length > 1 &&
            trailMarks.slice(0, -1).map((m, idx) => {
              const nextM = trailMarks[idx + 1];
              const x1 = toPct(m);
              const x2 = toPct(nextM);
              const xm = (x1 + x2) / 2;
              return (
                <path
                  key={`${m}_${nextM}`}
                  d={`M ${x1} 20 Q ${xm} 4 ${x2} 20`}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="1.2"
                />
              );
            })}
        </svg>

        {/* Bridge Deck Bar */}
        <div className="relative h-5 mx-[5%] rounded-lg bg-amber-600 border-b-4 border-amber-800 shadow-xs" />

        {/* Ticks & Interactive Marks */}
        <div className="relative h-14">
          {marks.map((val) => {
            const pct = toPct(val);
            const isMajor = val % ctx.majorStep === 0;
            const isTargetArrow = task.type === 'strich_zu_zahl' && ctx.targetMark === val;
            const isHiddenGap = hiddenSet.has(val);
            const filledGapVal = Object.entries(filledAnswers).find(([k]) => k.startsWith('gap_'))
              ? task.fields.find((f) => f.markValue === val && filledAnswers[f.id] !== undefined)
              : undefined;
            const isStart = ctx.startMark === val;
            const inTrail = trailSet.has(val);
            const isMascotHere = mascotMark === val;
            const showLabel = labeledSet.has(val) || showHelperRuler || isStart;

            return (
              <div
                key={val}
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pct}%` }}
              >
                {/* Mascot floating right above the tick */}
                {isMascotHere && (
                  <div className="absolute -top-20 pointer-events-none z-20">
                    <Mascot
                      animal={animal}
                      mood={mascotMood}
                      size={44}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                )}

                {/* Target Question Pointer */}
                {isTargetArrow && !showLandingBadge && (
                  <div className="absolute -top-11 px-2 py-0.5 rounded-lg bg-amber-400 text-amber-950 font-extrabold text-xs border border-amber-600 shadow-xs">
                    ?
                  </div>
                )}

                {/* Tap button over tick mark */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTapMark?.(val);
                  }}
                  aria-label={`Strich ${val}`}
                  className={`group flex flex-col items-center justify-start pt-0.5 ${
                    task.inputMode === 'tap_mark' ? 'cursor-pointer min-w-[30px] min-h-[44px]' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`block rounded-full transition-all ${
                      isTargetArrow
                        ? 'w-2 h-6 bg-amber-500 ring-2 ring-amber-200'
                        : inTrail
                          ? 'w-1.5 h-5 bg-emerald-600'
                          : isMajor
                            ? 'w-1 h-5 bg-slate-800 group-hover:bg-teal-600'
                            : 'w-0.5 h-3.5 bg-slate-500 group-hover:bg-teal-600 group-hover:w-1.5'
                    }`}
                  />
                  {isHiddenGap ? (
                    <span
                      className={`mt-1 px-1.5 py-0.5 rounded-md text-xs font-extrabold tabular-nums border ${
                        filledGapVal
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                          : 'bg-amber-100 border-amber-400 text-amber-900'
                      }`}
                    >
                      {filledGapVal ? filledAnswers[filledGapVal.id] : '?'}
                    </span>
                  ) : showLabel ? (
                    <span
                      className={`mt-1 text-xs font-extrabold tabular-nums px-1 rounded ${
                        isStart
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {val}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Landing Zahlwort + 80 + 4 Badge */}
      {showLandingBadge && landingParts && (
        <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-center">
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

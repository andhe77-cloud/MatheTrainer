import React from 'react';
import { splitTensOnes } from '../core/speech';
import type { AnimalType, MascotMood } from '../core/types';
import type { MathTask } from '../tasks/types';
import { Mascot } from './Mascot';

interface RechenwerkstattBoardProps {
  task: MathTask;
  animal: AnimalType;
  mascotMood: MascotMood;
  filledAnswers: Record<string, number>;
  showLandingBadge: { number: number; word: string } | null;
  reducedMotion: boolean;
}

const PlaceValueBlockPill: React.FC<{ num: number | '?'; highlight?: boolean }> = ({ num, highlight }) => {
  if (num === '?') {
    return (
      <span className="px-3 sm:px-4 py-1.5 sm:py-2 short:py-1 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 font-extrabold text-xl sm:text-3xl short:text-lg tabular-nums">
        ?
      </span>
    );
  }
  const { hundreds, tensValue, onesValue } = splitTensOnes(num);
  const tensDigit = Math.floor(tensValue / 10);
  return (
    <span
      className={`px-3 sm:px-4 py-1.5 sm:py-2 short:py-1 rounded-2xl border-2 font-extrabold text-xl sm:text-3xl short:text-lg tabular-nums inline-flex items-center ${
        highlight
          ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
          : 'bg-white border-slate-300 text-slate-900'
      }`}
    >
      {hundreds > 0 && <span className="text-emerald-700">{Math.floor(hundreds / 100)}</span>}
      {(tensDigit > 0 || hundreds > 0) && <span className="text-blue-700">{tensDigit}</span>}
      <span className="text-rose-700">{onesValue}</span>
    </span>
  );
};

export const RechenwerkstattBoard: React.FC<RechenwerkstattBoardProps> = ({
  task,
  animal,
  mascotMood,
  filledAnswers,
  showLandingBadge,
  reducedMotion,
}) => {
  const ctx = task.calcContext;
  if (!ctx) return null;

  const solved = showLandingBadge !== null || Object.keys(filledAnswers).length > 0;
  const landingParts = showLandingBadge ? splitTensOnes(showLandingBadge.number) : null;

  const leftVal = ctx.missingPos === 'left' && !solved ? '?' : ctx.a;
  const rightVal = ctx.missingPos === 'right' && !solved ? '?' : ctx.b;
  const resVal = ctx.missingPos === 'result' && !solved ? '?' : ctx.result;

  const aParts = splitTensOnes(ctx.a);

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-200 p-3 sm:p-5 short:p-2.5 shadow-[0_5px_0_#A7F3D0] flex flex-col gap-3 short:gap-2 select-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
          Trick: {ctx.strategyHint}
        </span>
        {ctx.helperEquation && (
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            Hilfe: {ctx.helperEquation}
          </span>
        )}
      </div>

      {/* Main Workbench Equation Stage */}
      <div className="rounded-2xl bg-gradient-to-b from-emerald-50 to-teal-50 border-2 border-emerald-200 p-3.5 sm:p-5 short:p-2.5 flex flex-col items-center gap-3 short:gap-2">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <div className="hidden sm:block short:hidden">
            <Mascot animal={animal} mood={mascotMood} size={60} reducedMotion={reducedMotion} />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <PlaceValueBlockPill num={leftVal} highlight={ctx.missingPos === 'left' && solved} />
            <span className="text-2xl sm:text-3xl short:text-xl font-extrabold text-emerald-700">
              {ctx.op === '+' ? '+' : '−'}
            </span>
            <PlaceValueBlockPill num={rightVal} highlight={ctx.missingPos === 'right' && solved} />
            <span className="text-2xl sm:text-3xl short:text-xl font-extrabold text-slate-500">=</span>
            <PlaceValueBlockPill num={resVal} highlight={ctx.missingPos === 'result' && solved} />
          </div>
        </div>

        {/* Visual Base-10 blocks for first number */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.floor(aParts.tensValue / 10) }).map((_, i) => (
              <span key={i} className="w-2.5 h-6 rounded-sm bg-blue-600 inline-block" />
            ))}
            {Array.from({ length: aParts.onesValue }).map((_, i) => (
              <span key={i} className="w-3 h-3 rounded-xs bg-rose-500 inline-block ml-0.5" />
            ))}
          </div>
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

import React from 'react';
import { splitTensOnes } from '../core/speech';
import type { AnimalType, MascotMood } from '../core/types';
import type { MathTask } from '../tasks/types';
import { Mascot } from './Mascot';

interface ZehneruebergangBoardProps {
  task: MathTask;
  animal: AnimalType;
  mascotMood: MascotMood;
  hopStep: number; // 0 = start, 1 = intermediateTen, 2 = target
  filledAnswers: Record<string, number>;
  showLandingBadge: { number: number; word: string } | null;
  reducedMotion: boolean;
  onSkipHop?: () => void;
}

export const ZehneruebergangBoard: React.FC<ZehneruebergangBoardProps> = ({
  task,
  animal,
  mascotMood,
  hopStep,
  filledAnswers,
  showLandingBadge,
  reducedMotion,
  onSkipHop,
}) => {
  const ctx = task.carryContext;
  if (!ctx) return null;

  const solved = showLandingBadge !== null || Object.keys(filledAnswers).length >= task.fields.length;
  const landingParts = showLandingBadge ? splitTensOnes(showLandingBadge.number) : null;
  const aParts = splitTensOnes(ctx.a);

  return (
    <div
      onClick={mascotMood === 'hop' && onSkipHop ? onSkipHop : undefined}
      className="bg-white rounded-3xl border-2 border-amber-200 p-3 sm:p-5 short:p-2.5 shadow-[0_5px_0_#FDE68A] flex flex-col gap-3 short:gap-2 select-none"
    >
      {/* Equation Header with Place-Value Colors */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-3 sm:px-4 py-2 sm:py-3 short:py-1.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xl sm:text-3xl short:text-lg font-extrabold tabular-nums">
        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-white border-2 border-slate-200 text-slate-900">
          {ctx.a}
        </span>
        <span className="text-amber-700">{ctx.op === '+' ? '+' : '−'}</span>
        {ctx.mode === 'complement_ten' || ctx.mode === 'complement_100' ? (
          <span className="px-3 py-0.5 sm:py-1 rounded-xl bg-amber-200 border-2 border-amber-500 text-amber-950">
            {solved ? ctx.b : '?'}
          </span>
        ) : (
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-white border-2 border-slate-200 text-slate-900">
            {ctx.b}
          </span>
        )}
        <span className="text-slate-500">=</span>
        {ctx.mode === 'complement_ten' || ctx.mode === 'complement_100' ? (
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-blue-600 text-white">{ctx.target}</span>
        ) : (
          <span className="px-3 py-0.5 sm:py-1 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900">
            {solved ? ctx.target : '?'}
          </span>
        )}
      </div>

      {/* Two-Jump Zehner-Bridge Arc Diagram */}
      <div className="rounded-2xl bg-gradient-to-b from-sky-50 to-amber-50 border border-amber-200 p-3 sm:p-4 short:p-2">
        <div className="text-xs font-bold text-amber-900 mb-1.5 text-center">
          Sprung über den Zehner (Erst zum Zehner, dann den Rest!)
        </div>

        <div className="grid grid-cols-3 items-end gap-2 pt-8 short:pt-6 pb-1.5 relative">
          {/* Node 1: Start */}
          <div className="flex flex-col items-center gap-1 relative">
            {hopStep === 0 && (
              <div className="absolute -top-11 short:-top-9 [&_svg]:w-9 [&_svg]:h-9 sm:[&_svg]:w-[42px] sm:[&_svg]:h-[42px]">
                <Mascot animal={animal} mood={mascotMood} size={42} reducedMotion={reducedMotion} />
              </div>
            )}
            <div className="w-full max-w-[100px] py-1.5 sm:py-2 short:py-1 rounded-xl bg-white border-2 border-slate-300 text-center font-extrabold text-base sm:text-lg short:text-sm text-slate-900 tabular-nums">
              {ctx.a}
            </div>
            <span className="text-[11px] font-bold text-slate-500">Start</span>
          </div>

          {/* Node 2: Intermediate Ten */}
          <div className="flex flex-col items-center gap-1 relative">
            {hopStep === 1 && (
              <div className="absolute -top-12">
                <Mascot animal={animal} mood={mascotMood} size={42} reducedMotion={reducedMotion} />
              </div>
            )}
            <div className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {ctx.op} {ctx.mode === 'decompose' ? (filledAnswers['step1'] ?? '?') : ctx.firstJump}
            </div>
            <div className="w-full max-w-[100px] py-2 rounded-xl bg-blue-600 border-2 border-blue-700 text-center font-extrabold text-lg text-white tabular-nums shadow-xs">
              {ctx.intermediateTen}
            </div>
            <span className="text-[11px] font-bold text-blue-800">Zehner-Stopp</span>
          </div>

          {/* Node 3: Final Target */}
          <div className="flex flex-col items-center gap-1 relative">
            {hopStep >= 2 && (
              <div className="absolute -top-12">
                <Mascot animal={animal} mood={mascotMood} size={42} reducedMotion={reducedMotion} />
              </div>
            )}
            {ctx.secondJump > 0 && (
              <div className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {ctx.op} {ctx.mode === 'decompose' ? (filledAnswers['step2'] ?? '?') : ctx.secondJump}
              </div>
            )}
            <div className="w-full max-w-[100px] py-2 rounded-xl bg-emerald-100 border-2 border-emerald-500 text-center font-extrabold text-lg text-emerald-950 tabular-nums">
              {solved || ctx.mode === 'complement_ten' || ctx.mode === 'complement_100'
                ? ctx.target
                : '?'}
            </div>
            <span className="text-[11px] font-bold text-emerald-800">Ziel</span>
          </div>
        </div>

        {/* Visual Base-10 Blocks for starting number */}
        <div className="mt-2 pt-2 border-t border-amber-200/70 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1" title="Zehnerstangen">
            {Array.from({ length: Math.floor(aParts.tensValue / 10) }).map((_, i) => (
              <span key={i} className="w-2.5 h-7 rounded-sm bg-blue-600 border border-blue-800 inline-block" />
            ))}
          </div>
          <div className="flex items-center gap-1" title="Einerwürfel">
            {Array.from({ length: aParts.onesValue }).map((_, i) => (
              <span key={i} className="w-3.5 h-3.5 rounded-xs bg-rose-500 border border-rose-700 inline-block" />
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

import React, { useState } from 'react';
import { ArrowRight, SkipForward, Sparkles } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import type { AnimalType, DigitTemplate, Stroke } from '../core/types';
import { FullscreenButton } from '../ui/DesignSystem';
import { Mascot } from '../ui/Mascot';
import { DigitCanvas } from './DigitCanvas';
import { DIGIT_SVG_GUIDES } from './templates';

interface WritingTrainerProps {
  animal: AnimalType;
  animalName: string;
  reducedMotion?: boolean;
  leftHanded?: boolean;
  onSaveTemplate: (tpl: DigitTemplate) => Promise<void> | void;
  onComplete: () => void;
  onSkip: () => void;
}

const TOTAL_ROUNDS = 2; // 2 samples per digit 0..9 = 20 samples

export const WritingTrainer: React.FC<WritingTrainerProps> = ({
  animal,
  animalName,
  reducedMotion = false,
  leftHanded = false,
  onSaveTemplate,
  onComplete,
  onSkip,
}) => {
  const [stepIndex, setStepIndex] = useState(0); // 0..19
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const totalSteps = 10 * TOTAL_ROUNDS;
  const currentDigit = Math.floor(stepIndex / TOTAL_ROUNDS);
  const currentRound = (stepIndex % TOTAL_ROUNDS) + 1;

  const handleSaveAndNext = async () => {
    if (strokes.length === 0) {
      soundEngine.playHmTone();
      setHintMsg(STRINGS_DE.training.drawSomethingFirst);
      return;
    }

    setHintMsg(null);
    soundEngine.playHopTone(stepIndex % 8);

    await onSaveTemplate({
      id: `train_${currentDigit}_${currentRound}_${Date.now()}`,
      digit: currentDigit,
      strokes,
      source: 'training',
      createdAt: Date.now(),
    });

    setStrokes([]);
    if (stepIndex + 1 >= totalSteps) {
      soundEngine.playSuccessChime();
      setFinished(true);
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  if (finished) {
    return (
      <div className="h-dvh overflow-y-auto no-scrollbar flex flex-col p-4 sm:p-6 bg-[#F4F6F9]">
        <div className="my-auto mx-auto w-full max-w-xl rounded-3xl bg-white border-2 border-slate-200 shadow-[0_6px_0_#CBD5E1] p-6 sm:p-8 short:p-5 flex flex-col items-center text-center gap-5 short:gap-3">
          <Mascot animal={animal} mood="happy" size={120} reducedMotion={reducedMotion} />
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl short:text-xl font-bold text-slate-900 text-balance">
              {STRINGS_DE.training.doneTitle}
            </h1>
            <p className="text-slate-600 text-base short:text-sm">
              {animalName} hat sich alle 10 Ziffern gemerkt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playBlockTap();
              onComplete();
            }}
            className="min-h-[56px] sm:min-h-[64px] px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg shadow-[0_5px_0_#047857] active:translate-y-1 flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            <span>{STRINGS_DE.training.doneButton}</span>
          </button>
        </div>
      </div>
    );
  }

  const guide = DIGIT_SVG_GUIDES[currentDigit];

  return (
    <div className="h-dvh overflow-y-auto no-scrollbar flex flex-col p-2.5 sm:p-6 short:p-2 bg-[#F4F6F9]">
      <div className="my-auto mx-auto w-full max-w-3xl rounded-3xl bg-white border-2 border-slate-200 shadow-[0_6px_0_#CBD5E1] p-4 sm:p-6 short:p-3.5 flex flex-col gap-3 sm:gap-4 short:gap-2">
        {/* Header & Progress */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-slate-100 pb-2.5 short:pb-2">
          <div>
            <h1 className="text-lg sm:text-2xl short:text-base font-bold text-slate-900">{STRINGS_DE.training.heading}</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 short:hidden">{STRINGS_DE.training.intro}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 tabular-nums">
              {STRINGS_DE.training.progressLabel(stepIndex, totalSteps)}
            </span>
            <FullscreenButton compact />
            <button
              type="button"
              onClick={onSkip}
              className="min-h-[40px] sm:min-h-[44px] short:min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <SkipForward className="w-4 h-4" />
              <span>{STRINGS_DE.training.skipButton}</span>
            </button>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full h-2.5 sm:h-3 rounded-full bg-slate-100 overflow-hidden shrink-0">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
          />
        </div>

        {/* Interactive Stage */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 short:gap-3 py-1">
          {/* Mascot + Guide Card */}
          <div className="flex flex-row md:flex-col items-center justify-around md:justify-center gap-3 sm:gap-4 short:gap-2 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 sm:p-5 short:p-2.5">
            <div className="flex items-center gap-3">
              <div className="[&_svg]:w-14 [&_svg]:h-14 sm:[&_svg]:w-20 sm:[&_svg]:h-20 short:[&_svg]:w-12 short:[&_svg]:h-12">
                <Mascot animal={animal} mood={strokes.length > 0 ? 'nod' : 'idle'} size={84} reducedMotion={reducedMotion} />
              </div>
              <div className="text-left">
                <p className="text-base sm:text-lg short:text-sm font-bold text-slate-900">
                  {STRINGS_DE.training.promptDigit(currentDigit, currentRound, TOTAL_ROUNDS)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Starte am grünen Punkt
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <svg viewBox="0 0 100 100" className="w-20 h-24 sm:w-28 sm:h-32 short:w-16 short:h-20 rounded-2xl border-2 border-blue-200 bg-white p-1.5 sm:p-2 shadow-xs">
                <line x1="10" y1="50" x2="90" y2="50" stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1.5" />
                <line x1="10" y1="86" x2="90" y2="86" stroke="#CBD5E1" strokeWidth="1.5" />
                {guide.paths.map((d, idx) => (
                  <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                <circle cx={guide.startDot[0]} cy={guide.startDot[1]} r="6" fill="#059669" />
              </svg>
            </div>
          </div>

          {/* Writing Box */}
          <div className="flex flex-col items-center gap-2">
            <DigitCanvas
              role="neutral"
              label={`Ziffer ${currentDigit}`}
              strokes={strokes}
              onStrokesChange={(s) => {
                setHintMsg(null);
                setStrokes(s);
              }}
              width={132}
              height={164}
              leftHanded={leftHanded}
            />
          </div>

          {/* Primary Action */}
          <div className="flex flex-col items-center md:items-start gap-2.5">
            <button
              type="button"
              onClick={() => void handleSaveAndNext()}
              className="w-full md:w-auto min-h-[54px] sm:min-h-[64px] short:min-h-[48px] px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg shadow-[0_5px_0_#047857] active:translate-y-1 flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              <span>{STRINGS_DE.training.nextButton}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {hintMsg && (
              <p className="text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                {hintMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import { createRng } from '../core/rng';
import type { DigitTemplate, RecognitionResult, Stroke } from '../core/types';
import { DigitCanvas, renderStrokesToDataUrl } from './DigitCanvas';
import { recognizeDigit } from './recognizer';
import { DIGIT_SVG_GUIDES } from './templates';

export interface NumberConfirmPayload {
  value: number;
  tensDigit: number | null;
  onesDigit: number;
  hundredsDigit: number | null;
  mirroredDigits: number[];
  clarifiedCount: number;
  avgConfidence: number;
  hadTensInWrongBox: boolean;
}

interface NumberInputPadProps {
  allowHundreds?: boolean;
  learnedTemplates: DigitTemplate[];
  onSaveLearnedTemplate: (tpl: DigitTemplate) => Promise<void> | void;
  onConfirm: (payload: NumberConfirmPayload) => void;
  onFirstStrokeTime?: () => void;
  leftHanded?: boolean;
  disabled?: boolean;
}

interface PendingClarification {
  slot: 'hundreds' | 'tens' | 'ones';
  pair: [number, number];
  strokes: Stroke[];
  snapshotUrl: string;
}

export const NumberInputPad: React.FC<NumberInputPadProps> = ({
  allowHundreds = false,
  learnedTemplates,
  onSaveLearnedTemplate,
  onConfirm,
  onFirstStrokeTime,
  leftHanded = false,
  disabled = false,
}) => {
  const [hundredsStrokes, setHundredsStrokes] = useState<Stroke[]>([]);
  const [tensStrokes, setTensStrokes] = useState<Stroke[]>([]);
  const [onesStrokes, setOnesStrokes] = useState<Stroke[]>([]);

  const [resolvedDigits, setResolvedDigits] = useState<{
    hundreds?: number;
    tens?: number;
    ones?: number;
  }>({});
  const [mirroredList, setMirroredList] = useState<number[]>([]);
  const [clarifiedCount, setClarifiedCount] = useState(0);
  const [confidences, setConfidences] = useState<number[]>([]);

  const [clarifyModal, setClarifyModal] = useState<PendingClarification | null>(null);
  const [unreadableHint, setUnreadableHint] = useState<string | null>(null);
  const [mirroredNotice, setMirroredNotice] = useState<{ digit: number; snapshotUrl: string } | null>(null);

  const hasAnyStrokes = useMemo(
    () => hundredsStrokes.length > 0 || tensStrokes.length > 0 || onesStrokes.length > 0,
    [hundredsStrokes, tensStrokes, onesStrokes]
  );

  const clearFeedback = () => {
    setUnreadableHint(null);
    setMirroredNotice(null);
  };

  const evaluateSlot = (
    slot: 'hundreds' | 'tens' | 'ones',
    strokes: Stroke[],
    currentResolved: { hundreds?: number; tens?: number; ones?: number },
    currentMirrored: number[],
    currentClarified: number,
    currentConfs: number[]
  ): { done: boolean; res?: RecognitionResult } => {
    const res = recognizeDigit(strokes, learnedTemplates);
    if (res.status === 'unreadable') {
      const rng = createRng(Date.now());
      const msg = rng.pick(STRINGS_DE.input.unreadableMessages);
      soundEngine.playHmTone();
      setUnreadableHint(msg);
      return { done: false, res };
    }

    if (res.status === 'clarify' && res.clarifyPair) {
      soundEngine.playHmTone();
      const ink = slot === 'tens' ? '#1E3A8A' : slot === 'ones' ? '#881337' : '#065F46';
      setClarifyModal({
        slot,
        pair: res.clarifyPair,
        strokes,
        snapshotUrl: renderStrokesToDataUrl(strokes, 120, 150, ink),
      });
      return { done: false, res };
    }

    const digit = res.digit!;
    const nextResolved = { ...currentResolved, [slot]: digit };
    const nextMirrored = res.mirrored ? [...currentMirrored, digit] : currentMirrored;
    const nextConfs = [...currentConfs, res.confidence];

    if (res.mirrored) {
      const ink = slot === 'tens' ? '#1E3A8A' : slot === 'ones' ? '#881337' : '#065F46';
      setMirroredNotice({
        digit,
        snapshotUrl: renderStrokesToDataUrl(strokes, 110, 136, ink),
      });
    }

    setResolvedDigits(nextResolved);
    setMirroredList(nextMirrored);
    setConfidences(nextConfs);

    // Check remaining slots
    return proceedAfterSlot(nextResolved, nextMirrored, currentClarified, nextConfs);
  };

  const proceedAfterSlot = (
    resolved: { hundreds?: number; tens?: number; ones?: number },
    mirrored: number[],
    clarified: number,
    confs: number[]
  ): { done: boolean } => {
    if (allowHundreds && hundredsStrokes.length > 0 && resolved.hundreds === undefined) {
      return evaluateSlot('hundreds', hundredsStrokes, resolved, mirrored, clarified, confs);
    }
    if (tensStrokes.length > 0 && resolved.tens === undefined) {
      return evaluateSlot('tens', tensStrokes, resolved, mirrored, clarified, confs);
    }
    if (onesStrokes.length > 0 && resolved.ones === undefined) {
      return evaluateSlot('ones', onesStrokes, resolved, mirrored, clarified, confs);
    }

    // All non-empty boxes recognized!
    // Spec 5.1: Empty tens box means single-digit number.
    // If child wrote ONLY in tens box and left ones box empty, treat it carefully and flag S2!
    const hVal = resolved.hundreds ?? 0;
    const tVal = resolved.tens ?? 0;
    let oVal = resolved.ones ?? 0;
    let hadTensInWrongBox = false;

    if (tensStrokes.length > 0 && onesStrokes.length === 0) {
      hadTensInWrongBox = true;
      oVal = resolved.tens ?? 0;
    }

    const finalValue = hadTensInWrongBox ? oVal : hVal * 100 + tVal * 10 + oVal;
    const avgConf = confs.length > 0 ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;

    onConfirm({
      value: finalValue,
      hundredsDigit: resolved.hundreds ?? null,
      tensDigit: hadTensInWrongBox ? null : (resolved.tens ?? null),
      onesDigit: oVal,
      mirroredDigits: mirrored,
      clarifiedCount: clarified,
      avgConfidence: avgConf,
      hadTensInWrongBox,
    });
    return { done: true };
  };

  const handleSubmit = () => {
    if (disabled || !hasAnyStrokes) return;
    clearFeedback();
    soundEngine.playBlockTap();
    const initialResolved: { hundreds?: number; tens?: number; ones?: number } = {};
    setResolvedDigits({});
    setMirroredList([]);
    setClarifiedCount(0);
    setConfidences([]);
    proceedAfterSlot(initialResolved, [], 0, []);
  };

  const handleClarifyChoice = async (chosenDigit: number) => {
    if (!clarifyModal) return;
    soundEngine.playBlockTap();
    const newTpl: DigitTemplate = {
      id: `clarified_${chosenDigit}_${Date.now()}`,
      digit: chosenDigit,
      strokes: clarifyModal.strokes,
      source: 'clarified',
      createdAt: Date.now(),
    };
    await onSaveLearnedTemplate(newTpl);

    const nextResolved = { ...resolvedDigits, [clarifyModal.slot]: chosenDigit };
    const nextClarified = clarifiedCount + 1;
    const nextConfs = [...confidences, 0.85];

    setClarifyModal(null);
    setResolvedDigits(nextResolved);
    setClarifiedCount(nextClarified);
    setConfidences(nextConfs);

    proceedAfterSlot(nextResolved, mirroredList, nextClarified, nextConfs);
  };

  const handleClarifyRetry = () => {
    if (!clarifyModal) return;
    const slot = clarifyModal.slot;
    setClarifyModal(null);
    if (slot === 'hundreds') setHundredsStrokes([]);
    if (slot === 'tens') setTensStrokes([]);
    if (slot === 'ones') setOnesStrokes([]);
  };

  const submitButton = (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={disabled || !hasAnyStrokes}
      className={`min-h-[56px] sm:min-h-[64px] short:min-h-[46px] px-5 sm:px-7 short:px-4 py-3 short:py-2 rounded-2xl font-bold text-base sm:text-lg short:text-sm text-white flex items-center justify-center gap-2 shadow-[0_5px_0_#047857] active:translate-y-1 active:shadow-[0_2px_0_#047857] transition-all whitespace-nowrap shrink-0 ${
        hasAnyStrokes
          ? 'bg-emerald-600 hover:bg-emerald-500 ring-4 ring-emerald-200'
          : 'bg-slate-300 shadow-[0_4px_0_#94A3B8] cursor-not-allowed text-slate-500 ring-0'
      }`}
    >
      <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
      <span>{STRINGS_DE.input.done}</span>
    </button>
  );

  return (
    <div className="w-full flex flex-col items-center gap-3 short:gap-2">
      {/* Writing Boxes + Done Button (mirrored in Left-Handed Mode) */}
      <div
        className={`flex flex-wrap items-center justify-center gap-3 sm:gap-5 short:gap-2.5 ${
          leftHanded ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <div className="flex items-start gap-2 sm:gap-3 short:gap-2">
          {allowHundreds && (
            <DigitCanvas
              role="hundreds"
              strokes={hundredsStrokes}
              onStrokesChange={(s) => {
                clearFeedback();
                setHundredsStrokes(s);
              }}
              onFirstStrokeTime={onFirstStrokeTime}
              disabled={disabled}
              leftHanded={leftHanded}
            />
          )}
          <DigitCanvas
            role="tens"
            strokes={tensStrokes}
            onStrokesChange={(s) => {
              clearFeedback();
              setTensStrokes(s);
            }}
            onFirstStrokeTime={onFirstStrokeTime}
            disabled={disabled}
            leftHanded={leftHanded}
          />
          <DigitCanvas
            role="ones"
            strokes={onesStrokes}
            onStrokesChange={(s) => {
              clearFeedback();
              setOnesStrokes(s);
            }}
            onFirstStrokeTime={onFirstStrokeTime}
            disabled={disabled}
            leftHanded={leftHanded}
          />
        </div>

        {submitButton}
      </div>

      {/* Friendly Unreadable Message (Warm Amber, never red) */}
      {unreadableHint && (
        <div
          role="status"
          className="max-w-md rounded-2xl bg-amber-50 border-2 border-amber-300 px-5 py-3 text-amber-900 font-semibold text-base flex items-center gap-3 shadow-sm"
        >
          <RefreshCw className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{unreadableHint}</span>
        </div>
      )}

      {/* Friendly Mirrored Digit Hint (counts as valid math answer, S1 writing hint) */}
      {mirroredNotice && (
        <div className="max-w-lg rounded-2xl bg-sky-50 border-2 border-sky-200 px-5 py-3.5 text-slate-800 flex items-center gap-4 shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center">
              <img
                src={mirroredNotice.snapshotUrl}
                alt={STRINGS_DE.input.mirroredCompareYours}
                className="w-12 h-14 rounded-lg border border-slate-300 bg-white object-contain"
              />
              <span className="text-[11px] text-slate-500 mt-1">{STRINGS_DE.input.mirroredCompareYours}</span>
            </div>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 100 100" className="w-12 h-14 rounded-lg border border-sky-300 bg-white p-1">
                {DIGIT_SVG_GUIDES[mirroredNotice.digit]?.paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
              <span className="text-[11px] text-sky-700 font-semibold mt-1">
                {STRINGS_DE.input.mirroredCompareGuide}
              </span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {STRINGS_DE.input.mirroredHint(mirroredNotice.digit)}
          </p>
        </div>
      )}

      {/* Clarification Modal ("Meinst du eine 7 oder eine 1?") */}
      {clarifyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 p-6 shadow-xl flex flex-col items-center gap-5">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">
                {STRINGS_DE.input.clarifyTitle(clarifyModal.pair[0], clarifyModal.pair[1])}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{STRINGS_DE.input.clarifySubtitle}</p>
            </div>

            <div className="p-2 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <img
                src={clarifyModal.snapshotUrl}
                alt="Deine geschriebene Ziffer"
                className="w-24 h-28 object-contain rounded-xl bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {clarifyModal.pair.map((candDigit) => (
                <button
                  key={candDigit}
                  type="button"
                  onClick={() => void handleClarifyChoice(candDigit)}
                  className="min-h-[72px] rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-2xl shadow-[0_4px_0_#1D4ED8] active:translate-y-1 active:shadow-[0_1px_0_#1D4ED8] flex items-center justify-center gap-2 transition-all"
                >
                  <span>{candDigit}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleClarifyRetry}
              className="min-h-[48px] px-5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm"
            >
              {STRINGS_DE.input.clarifyRetry}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

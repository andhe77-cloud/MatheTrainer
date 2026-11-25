import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, FlaskConical, Play, PlusCircle, RotateCcw } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import type { DigitTemplate, RecognitionResult, Stroke } from '../core/types';
import { FullscreenButton } from '../ui/DesignSystem';
import { DigitCanvas } from './DigitCanvas';
import { NumberInputPad, type NumberConfirmPayload } from './NumberInputPad';
import { recognizeDigit } from './recognizer';
import { runSyntheticBenchmark, type BenchmarkMetrics } from './syntheticBenchmark';

interface HandwritingTestbedProps {
  learnedTemplates: DigitTemplate[];
  onSaveTemplate: (tpl: DigitTemplate) => Promise<void> | void;
  leftHanded: boolean;
  reducedMotion: boolean;
  onToggleLeftHanded: (val: boolean) => void;
  onToggleReducedMotion: (val: boolean) => void;
  onBack: () => void;
}

export const HandwritingTestbed: React.FC<HandwritingTestbedProps> = ({
  learnedTemplates,
  onSaveTemplate,
  leftHanded,
  reducedMotion,
  onToggleLeftHanded,
  onToggleReducedMotion,
  onBack,
}) => {
  const [singleStrokes, setSingleStrokes] = useState<Stroke[]>([]);
  const [liveResult, setLiveResult] = useState<RecognitionResult | null>(null);
  const [collectDigit, setCollectDigit] = useState<number>(4);
  const [benchmark, setBenchmark] = useState<BenchmarkMetrics | null>(null);
  const [lastConfirmed, setLastConfirmed] = useState<NumberConfirmPayload | null>(null);
  const [padKey, setPadKey] = useState(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const collectedSamples = useMemo(
    () => learnedTemplates.filter((t) => t.source === 'testbed' || t.source === 'training' || t.source === 'clarified'),
    [learnedTemplates]
  );

  const handleStrokesUpdate = (s: Stroke[]) => {
    setSingleStrokes(s);
    if (s.length === 0) {
      setLiveResult(null);
    } else {
      setLiveResult(recognizeDigit(s, learnedTemplates));
    }
  };

  const handleRunBenchmark = () => {
    soundEngine.playBlockTap();
    const res = runSyntheticBenchmark(learnedTemplates);
    setBenchmark(res);
  };

  const handleSaveSample = async () => {
    if (singleStrokes.length === 0) return;
    soundEngine.playSuccessChime();
    await onSaveTemplate({
      id: `testbed_${collectDigit}_${Date.now()}`,
      digit: collectDigit,
      strokes: singleStrokes,
      source: 'testbed',
      createdAt: Date.now(),
    });
    setSaveToast(`Ziffer ${collectDigit} als Lernbeispiel gespeichert!`);
    setSingleStrokes([]);
    setLiveResult(null);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleExportSamplesJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      count: learnedTemplates.length,
      templates: learnedTemplates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kloetzchen-schriftproben-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#F4F6F9] p-2.5 sm:p-4 short:p-2 flex flex-col">
      <div className="max-w-6xl w-full h-full mx-auto flex flex-col gap-2.5 sm:gap-3 min-h-0">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-white rounded-2xl border-2 border-slate-200 px-3 sm:px-4 py-2 short:py-1.5 shadow-[0_3px_0_#CBD5E1] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] sm:min-h-[44px] short:min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{STRINGS_DE.testbed.backToMap}</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900">{STRINGS_DE.testbed.heading}</h1>
              <p className="text-xs text-slate-600 hidden sm:block short:hidden">{STRINGS_DE.testbed.subheading}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <label className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={leftHanded}
                onChange={(e) => onToggleLeftHanded(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span>{STRINGS_DE.testbed.leftHandedToggle}</span>
            </label>
            <label className="min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-1 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => onToggleReducedMotion(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span>{STRINGS_DE.testbed.reducedMotionToggle}</span>
            </label>
            <FullscreenButton compact />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-3 sm:space-y-4 pb-2">
          {/* Two-column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Left: Single Digit Live Diagnostics & Sample Collector */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 shadow-[0_4px_0_#CBD5E1] flex flex-col gap-4 sm:gap-5">
            <h2 className="text-lg font-bold text-slate-900">{STRINGS_DE.testbed.singleDigitTestTitle}</h2>

            <div className="flex flex-wrap items-start gap-6">
              <DigitCanvas
                role="neutral"
                label="Test-Kästchen"
                strokes={singleStrokes}
                onStrokesChange={handleStrokesUpdate}
                width={156}
                height={190}
                leftHanded={leftHanded}
              />

              <div className="flex-1 min-w-[220px] space-y-3">
                {liveResult ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {liveResult.status === 'clear'
                          ? `${STRINGS_DE.testbed.statusClear}: ${liveResult.digit}`
                          : liveResult.status === 'clarify'
                            ? `${STRINGS_DE.testbed.statusClarify}: ${liveResult.clarifyPair?.join(' oder ')}`
                            : STRINGS_DE.testbed.statusUnreadable}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-600">
                        {liveResult.durationMs.toFixed(1)} ms
                      </span>
                    </div>

                    {liveResult.mirrored && (
                      <div className="rounded-xl bg-sky-100 text-sky-900 px-3 py-1.5 text-xs font-bold">
                        {STRINGS_DE.testbed.mirroredFlag}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      {liveResult.candidates.map((cand) => (
                        <div key={cand.digit} className="flex items-center gap-2 text-xs">
                          <span className="w-5 font-bold font-mono tabular-nums text-slate-800">{cand.digit}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.round(cand.probability * 100)}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono tabular-nums text-slate-600">
                            {(cand.probability * 100).toFixed(0)} %
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Schreibe eine Ziffer von 0 bis 9 (gerne auch spiegelverkehrt) für die Live-Auswertung.
                  </div>
                )}

                {/* Sample Collector */}
                <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-800">{STRINGS_DE.testbed.collectTitle}</div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {STRINGS_DE.testbed.savedCountLabel(collectedSamples.length)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCollectDigit(d)}
                        className={`w-9 h-9 rounded-lg font-bold text-sm tabular-nums ${
                          collectDigit === d
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveSample()}
                      disabled={singleStrokes.length === 0}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{STRINGS_DE.testbed.collectSaveBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportSamplesJson}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>{STRINGS_DE.testbed.exportJsonBtn}</span>
                    </button>
                  </div>
                  {saveToast && <p className="text-xs font-semibold text-emerald-700">{saveToast}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Right: 2-Digit Number Input Pad (Zehner + Einer) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-[0_4px_0_#CBD5E1] flex flex-col gap-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">{STRINGS_DE.testbed.twoDigitTestTitle}</h2>
              <button
                type="button"
                onClick={() => {
                  setPadKey((k) => k + 1);
                  setLastConfirmed(null);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Leeren</span>
              </button>
            </div>

            <p className="text-xs text-slate-600">{STRINGS_DE.map.placeValueLegend}</p>

            <NumberInputPad
              key={padKey}
              learnedTemplates={learnedTemplates}
              onSaveLearnedTemplate={onSaveTemplate}
              leftHanded={leftHanded}
              onConfirm={(payload) => {
                soundEngine.playSuccessChime();
                setLastConfirmed(payload);
              }}
            />

            {lastConfirmed && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-emerald-800">
                    {STRINGS_DE.testbed.lastConfirmedPrefix}
                  </span>
                  <div className="text-3xl font-bold text-emerald-900 tabular-nums">{lastConfirmed.value}</div>
                </div>
                <div className="text-xs text-emerald-800 space-y-0.5 font-mono tabular-nums">
                  <div>Konfidenz: {(lastConfirmed.avgConfidence * 100).toFixed(0)} %</div>
                  <div>Rückfragen: {lastConfirmed.clarifiedCount}</div>
                  {lastConfirmed.mirroredDigits.length > 0 && (
                    <div>Gespiegelt: {lastConfirmed.mirroredDigits.join(', ')} (S1)</div>
                  )}
                  {lastConfirmed.hadTensInWrongBox && <div>Hinweis S2: In Zehnerkästchen geschrieben</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Synthetic Benchmark Runner (Spec 5.4) */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-[0_4px_0_#CBD5E1] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <span>{STRINGS_DE.testbed.benchmarkTitle}</span>
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">{STRINGS_DE.testbed.benchmarkDesc}</p>
            </div>
            <button
              type="button"
              onClick={handleRunBenchmark}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_4px_0_#1D4ED8] active:translate-y-1 flex items-center gap-2 whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{STRINGS_DE.testbed.benchmarkRun}</span>
            </button>
          </div>

          {benchmark && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Beispiele</div>
                <div className="text-xl font-bold tabular-nums text-slate-900">{benchmark.totalSamples}</div>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="text-xs text-emerald-700">Auto-Genauigkeit (Ziel ≥95%)</div>
                <div className="text-xl font-bold tabular-nums text-emerald-900">
                  {benchmark.autoAcceptAccuracyPct.toFixed(1)} %
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Rückfragequote (Ziel ≤15%)</div>
                <div className="text-xl font-bold tabular-nums text-slate-900">
                  {benchmark.clarificationRatePct.toFixed(1)} %
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="text-xs text-emerald-700">Falschannahme (Ziel ≤1%)</div>
                <div className="text-xl font-bold tabular-nums text-emerald-900">
                  {benchmark.falseAcceptRatePct.toFixed(2)} %
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Ø Zeit (&lt; 50 ms)</div>
                <div className="text-xl font-bold tabular-nums text-slate-900">
                  {benchmark.avgDurationMs.toFixed(2)} ms
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-xs text-slate-500">Gespiegelt / Unlesbar</div>
                <div className="text-xl font-bold tabular-nums text-slate-900">
                  {benchmark.mirroredDetectedCount}/{benchmark.mirroredTestedCount} ·{' '}
                  {benchmark.scribblesRejectedCount}/{benchmark.scribblesTestedCount}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

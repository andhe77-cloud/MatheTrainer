import { createRng } from '../core/rng';
import type { DigitTemplate, Stroke } from '../core/types';
import { recognizeDigit } from './recognizer';
import { BUILTIN_TEMPLATES, mirrorStrokePoints } from './templates';

export interface BenchmarkMetrics {
  totalSamples: number;
  autoAccepted: number;
  autoCorrect: number;
  autoWrong: number;
  clarified: number;
  clarifiedContainsTrue: number;
  unreadable: number;
  autoAcceptAccuracyPct: number;
  clarificationRatePct: number;
  falseAcceptRatePct: number;
  avgDurationMs: number;
  maxDurationMs: number;
  mirroredDetectedCount: number;
  mirroredTestedCount: number;
  scribblesRejectedCount: number;
  scribblesTestedCount: number;
}

function perturbStrokes(strokes: Stroke[], seed: string, boxWidth = 140, boxHeight = 180): Stroke[] {
  const rng = createRng(seed);
  const angle = (rng.next() - 0.5) * 0.24; // +/- ~7 degrees
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const scaleX = 0.85 + rng.next() * 0.30;
  const scaleY = 0.85 + rng.next() * 0.30;
  const shiftX = (rng.next() - 0.5) * 0.08;
  const shiftY = (rng.next() - 0.5) * 0.08;

  return strokes.map((stroke) =>
    stroke.map((pt) => {
      const rx = pt.x - 0.5;
      const ry = pt.y - 0.5;
      const rotX = rx * cosA - ry * sinA;
      const rotY = rx * sinA + ry * cosA;
      const jx = (rng.next() - 0.5) * 0.025;
      const jy = (rng.next() - 0.5) * 0.025;
      return {
        x: (0.5 + rotX * scaleX + shiftX + jx) * boxWidth,
        y: (0.5 + rotY * scaleY + shiftY + jy) * boxHeight,
        t: pt.t,
      };
    })
  );
}

export function runSyntheticBenchmark(learnedTemplates: DigitTemplate[] = []): BenchmarkMetrics {
  const samplesPerTemplate = 12;
  let totalSamples = 0;
  let autoAccepted = 0;
  let autoCorrect = 0;
  let autoWrong = 0;
  let clarified = 0;
  let clarifiedContainsTrue = 0;
  let unreadable = 0;
  let totalDurationMs = 0;
  let maxDurationMs = 0;

  for (const tpl of BUILTIN_TEMPLATES) {
    for (let i = 0; i < samplesPerTemplate; i++) {
      const noisy = perturbStrokes(tpl.strokes, `${tpl.id}_${i}`);
      const res = recognizeDigit(noisy, learnedTemplates);
      totalSamples++;
      totalDurationMs += res.durationMs;
      if (res.durationMs > maxDurationMs) maxDurationMs = res.durationMs;

      if (res.status === 'clear') {
        autoAccepted++;
        if (res.digit === tpl.digit) {
          autoCorrect++;
        } else {
          autoWrong++;
        }
      } else if (res.status === 'clarify') {
        clarified++;
        if (res.clarifyPair?.includes(tpl.digit)) {
          clarifiedContainsTrue++;
        }
      } else {
        unreadable++;
      }
    }
  }

  // Test mirrored digits (3, 4, 6, 7, 9)
  const mirroredTargets = [3, 4, 6, 7, 9].map(
    (d) => BUILTIN_TEMPLATES.find((t) => t.digit === d)!
  );
  let mirroredDetectedCount = 0;
  for (let i = 0; i < mirroredTargets.length; i++) {
    const tpl = mirroredTargets[i];
    const mirrored = mirrorStrokePoints(tpl.strokes).map((s) =>
      s.map((p) => ({ x: p.x * 140, y: p.y * 180, t: p.t }))
    );
    const res = recognizeDigit(mirrored, learnedTemplates);
    if (res.mirrored && res.digit === tpl.digit) {
      mirroredDetectedCount++;
    }
  }

  // Test unreadable scribbles / tiny dots
  const scribbleSamples: Stroke[][] = [
    [[{ x: 50, y: 50, t: 0 }, { x: 52, y: 51, t: 10 }]], // tiny dot
    [
      [{ x: 10, y: 20, t: 0 }, { x: 120, y: 25, t: 10 }],
      [{ x: 10, y: 50, t: 20 }, { x: 120, y: 55, t: 30 }],
      [{ x: 10, y: 80, t: 40 }, { x: 120, y: 85, t: 50 }],
      [{ x: 10, y: 110, t: 60 }, { x: 120, y: 115, t: 70 }],
      [{ x: 10, y: 140, t: 80 }, { x: 120, y: 145, t: 90 }],
    ], // 5 horizontal scribble strokes
  ];
  let scribblesRejectedCount = 0;
  for (const sc of scribbleSamples) {
    const res = recognizeDigit(sc, learnedTemplates);
    if (res.status === 'unreadable') {
      scribblesRejectedCount++;
    }
  }

  return {
    totalSamples,
    autoAccepted,
    autoCorrect,
    autoWrong,
    clarified,
    clarifiedContainsTrue,
    unreadable,
    autoAcceptAccuracyPct: autoAccepted > 0 ? (autoCorrect / autoAccepted) * 100 : 0,
    clarificationRatePct: totalSamples > 0 ? (clarified / totalSamples) * 100 : 0,
    falseAcceptRatePct: totalSamples > 0 ? (autoWrong / totalSamples) * 100 : 0,
    avgDurationMs: totalSamples > 0 ? totalDurationMs / totalSamples : 0,
    maxDurationMs,
    mirroredDetectedCount,
    mirroredTestedCount: mirroredTargets.length,
    scribblesRejectedCount,
    scribblesTestedCount: scribbleSamples.length,
  };
}

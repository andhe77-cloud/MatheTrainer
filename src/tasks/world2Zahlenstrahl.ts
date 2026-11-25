import { APP_CONFIG } from '../content/config';
import { createRng, type SeededRng } from '../core/rng';
import { matchAnswerToFaults, type TaskFaultCandidate } from '../diagnostics/errorModel';
import type { MathTask, TaskFieldSpec, World2TaskType } from './types';
import { reverseTwoDigits } from './world1Hundertertafel';

interface SegmentConfig {
  min: number;
  max: number;
  step: number;
  majorStep: number;
}

function getLevelSegments(level: number): SegmentConfig[] {
  if (level <= 2) {
    return [
      { min: 0, max: 20, step: 1, majorStep: 5 },
      { min: 10, max: 20, step: 1, majorStep: 5 },
    ];
  }
  if (level <= 4) {
    return [
      { min: 40, max: 60, step: 1, majorStep: 5 },
      { min: 70, max: 100, step: 2, majorStep: 10 },
    ];
  }
  if (level <= 6) {
    return [
      { min: 0, max: 100, step: 5, majorStep: 10 },
      { min: 0, max: 100, step: 10, majorStep: 20 },
    ];
  }
  return [
    { min: 0, max: 100, step: 5, majorStep: 10 },
    { min: 30, max: 50, step: 1, majorStep: 5 },
    { min: 60, max: 90, step: 2, majorStep: 10 },
  ];
}

function getAllMarks(seg: SegmentConfig): number[] {
  const marks: number[] = [];
  for (let v = seg.min; v <= seg.max; v += seg.step) {
    marks.push(v);
  }
  return marks;
}

function addNumberLineReversal(faults: TaskFaultCandidate[], expected: number): void {
  const rev = reverseTwoDigits(expected);
  if (rev !== null && rev !== expected) {
    faults.push({ category: 'Z5_zahlendreher', answer: rev });
  }
}

function nearestLabeledMark(val: number, labeled: number[]): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (const m of labeled) {
    const d = Math.abs(m - val);
    if (d > 0 && d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best;
}

function generateStrichZuZahl(id: string, level: number, rng: SeededRng, seg: SegmentConfig): MathTask {
  const marks = getAllMarks(seg);
  const labeled = marks.filter((m) => m % seg.majorStep === 0);
  const unlabeled = marks.filter((m) => m % seg.majorStep !== 0 && m > seg.min && m < seg.max);
  const target = rng.pick(unlabeled.length > 0 ? unlabeled : marks.slice(1, -1));

  const faults: TaskFaultCandidate[] = [];
  const nearLabel = nearestLabeledMark(target, labeled);
  if (nearLabel !== null) {
    faults.push({ category: 'Z4_beschriftung_gelesen', answer: nearLabel });
  }
  // Misjudged step size (using step=1 instead of seg.step or vice versa)
  if (seg.step > 1) {
    const lowerMajor = Math.floor(target / seg.majorStep) * seg.majorStep;
    const stepsCountedAs1 = lowerMajor + Math.round((target - lowerMajor) / seg.step);
    if (stepsCountedAs1 !== target) {
      faults.push({ category: 'Z2_schrittweite_falsch', answer: stepsCountedAs1 });
    }
  } else {
    faults.push({ category: 'Z2_schrittweite_falsch', answer: target + 2 });
  }
  faults.push({ category: 'Z1_startstrich_mitgezaehlt', answer: target - seg.step });
  addNumberLineReversal(faults, target);

  return {
    id,
    world: 2,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z2.strich_zu_zahl',
    type: 'strich_zu_zahl',
    promptText: 'Welche Zahl zeigt der Pfeil auf der Zahlenbrücke?',
    spokenPrompt: 'Welche Zahl zeigt der Pfeil auf der Zahlenbrücke?',
    helpText: `Schau auf die großen Markierungsstriche. Jeder kleine Strich zählt ${seg.step} weiter.`,
    inputMode: 'single_number',
    fields: [
      {
        id: 'mark',
        label: 'Zahl am Pfeil',
        expected: target,
        allowHundreds: target >= 100,
        faults,
      },
    ],
    expectedValue: target,
    numberLineContext: {
      min: seg.min,
      max: seg.max,
      step: seg.step,
      majorStep: seg.majorStep,
      labeledMarks: labeled,
      startMark: seg.min,
      targetMark: target,
      hopPath: [seg.min, Math.floor(target / seg.majorStep) * seg.majorStep, target].filter(
        (v, idx, arr) => v >= seg.min && arr.indexOf(v) === idx
      ),
    },
  };
}

function generateZahlZuStrich(id: string, level: number, rng: SeededRng, seg: SegmentConfig): MathTask {
  const marks = getAllMarks(seg);
  const labeled = marks.filter((m) => m % seg.majorStep === 0);
  const candidates = marks.filter((m) => m > seg.min && m < seg.max && !labeled.includes(m));
  const target = rng.pick(candidates.length > 0 ? candidates : marks.slice(1, -1));

  const faults: TaskFaultCandidate[] = [
    { category: 'Z1_startstrich_mitgezaehlt', answer: target - seg.step },
    { category: 'Z2_schrittweite_falsch', answer: target + seg.step },
  ];
  const nearLabel = nearestLabeledMark(target, labeled);
  if (nearLabel !== null) {
    faults.push({ category: 'Z4_beschriftung_gelesen', answer: nearLabel });
  }
  addNumberLineReversal(faults, target);

  return {
    id,
    world: 2,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z2.zahl_zu_strich',
    type: 'zahl_zu_strich',
    promptText: `Tippe auf die Zahl ${target} auf der Zahlenbrücke!`,
    spokenPrompt: `Wo liegt die ${target}? Tippe auf den richtigen Strich auf der Zahlenbrücke.`,
    helpText: `Suche erst den nächsten großen Zehner- oder Fünferstrich und zähle in ${seg.step}er-Schritten weiter.`,
    inputMode: 'tap_mark',
    fields: [
      {
        id: 'tap',
        label: `Strich für ${target}`,
        expected: target,
        markValue: target,
        faults,
      },
    ],
    expectedValue: target,
    numberLineContext: {
      min: seg.min,
      max: seg.max,
      step: seg.step,
      majorStep: seg.majorStep,
      labeledMarks: labeled,
      startMark: seg.min,
      targetMark: target,
      tapTarget: target,
      hopPath: [seg.min, target],
    },
  };
}

function generateStrichZaehlen(
  id: string,
  level: number,
  rng: SeededRng,
  seg: SegmentConfig,
  strichZaehlung: 'start_zaehlt_nicht' | 'start_ist_erster'
): MathTask {
  const marks = getAllMarks(seg);
  const labeled = marks.filter((m) => m % seg.majorStep === 0);
  const goRight = level === 1 ? true : rng.next() < 0.6;
  const maxSteps = Math.min(5, Math.floor(marks.length / 3));
  const steps = rng.int(2, Math.max(2, maxSteps));

  const validStarts = marks.filter((m) => {
    const end = goRight ? m + steps * seg.step : m - steps * seg.step;
    return end >= seg.min && end <= seg.max;
  });
  const start = rng.pick(validStarts);

  // Respect O1 setting!
  const effectiveSteps = strichZaehlung === 'start_ist_erster' ? Math.max(1, steps - 1) : steps;
  const delta = (goRight ? 1 : -1) * effectiveSteps * seg.step;
  const target = start + delta;

  const faults: TaskFaultCandidate[] = [
    // Z1: Start mark counted (or NOT counted if setting flipped)
    {
      category: 'Z1_startstrich_mitgezaehlt',
      answer: target - (goRight ? seg.step : -seg.step),
    },
    // Z3: Wrong direction
    {
      category: 'Z3_richtung_falsch',
      answer: start - delta,
    },
    // Z2: Wrong step width (assumed 1 instead of seg.step, or double step)
    {
      category: 'Z2_schrittweite_falsch',
      answer:
        seg.step > 1
          ? start + (goRight ? 1 : -1) * effectiveSteps
          : start + (goRight ? 1 : -1) * effectiveSteps * 2,
    },
  ];
  addNumberLineReversal(faults, target);

  const dirWord = goRight ? 'nach rechts' : 'nach links';
  const promptText =
    strichZaehlung === 'start_zaehlt_nicht'
      ? `Starte bei ${start}. Hüpfe ${steps} Striche ${dirWord}. Wo landest du?`
      : `Starte bei ${start} (erster Strich) und zähle insgesamt ${steps} Striche ${dirWord}. Wo landest du?`;

  const hopPath: number[] = [start];
  for (let i = 1; i <= effectiveSteps; i++) {
    hopPath.push(start + (goRight ? 1 : -1) * i * seg.step);
  }

  return {
    id,
    world: 2,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z2.strich_zaehlen',
    type: 'strich_zaehlen',
    promptText,
    spokenPrompt: promptText,
    helpText:
      strichZaehlung === 'start_zaehlt_nicht'
        ? `Starte bei ${start}. Erst beim ersten Hüpfer ${dirWord} zählst du „eins“!`
        : `Jeder Strichabstand beträgt ${seg.step}. Achte auf die Richtung ${dirWord}.`,
    inputMode: 'single_number',
    fields: [
      {
        id: 'target',
        label: 'Zielzahl',
        expected: target,
        allowHundreds: target >= 100,
        faults,
      },
    ],
    expectedValue: target,
    numberLineContext: {
      min: seg.min,
      max: seg.max,
      step: seg.step,
      majorStep: seg.majorStep,
      labeledMarks: labeled,
      startMark: start,
      targetMark: target,
      hopPath,
    },
  };
}

function generateLueckenStrahl(id: string, level: number, rng: SeededRng, seg: SegmentConfig): MathTask {
  const marks = getAllMarks(seg);
  const majorMarks = marks.filter((m) => m % seg.majorStep === 0);
  const pool = majorMarks.length >= 4 ? majorMarks : marks;
  const inner = pool.slice(1, -1);
  const gapCount = level <= 3 ? 2 : 3;
  const chosenGaps = rng
    .shuffle(inner)
    .slice(0, Math.min(gapCount, inner.length))
    .sort((a, b) => a - b);

  const labeledMarks = pool.filter((m) => !chosenGaps.includes(m));
  const fields: TaskFieldSpec[] = chosenGaps.map((val, idx) => {
    const faults: TaskFaultCandidate[] = [
      { category: 'Z2_schrittweite_falsch', answer: val + seg.step },
      { category: 'Z2_schrittweite_falsch', answer: val - seg.step },
      { category: 'Z4_beschriftung_gelesen', answer: val + seg.majorStep },
    ];
    addNumberLineReversal(faults, val);
    return {
      id: `gap_${idx}`,
      label: `Lücke ${idx + 1}`,
      expected: val,
      markValue: val,
      allowHundreds: val >= 100,
      faults,
    };
  });

  return {
    id,
    world: 2,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z2.luecken',
    type: 'luecken_strahl',
    promptText: 'Welche Zahlen fehlen in den Lücken der Zahlenbrücke?',
    spokenPrompt: 'Welche Zahlen fehlen in den Lücken der Zahlenbrücke?',
    helpText: `Der Abstand zwischen den großen Strichen bleibt immer gleich (+${seg.majorStep}).`,
    inputMode: 'multi_fields',
    fields,
    expectedValue: chosenGaps,
    numberLineContext: {
      min: seg.min,
      max: seg.max,
      step: seg.step,
      majorStep: seg.majorStep,
      labeledMarks,
      startMark: seg.min,
      targetMark: chosenGaps[chosenGaps.length - 1],
      hopPath: [seg.min, ...chosenGaps],
      hiddenMarks: chosenGaps,
    },
  };
}

function generateZwischenzahl(id: string, level: number, rng: SeededRng, seg: SegmentConfig): MathTask {
  const marks = getAllMarks(seg);
  const labeled = marks.filter((m) => m % seg.majorStep === 0);
  // Find two marks with even distance so exact midpoint exists on the line
  const halfSteps = rng.int(1, 2);
  const dist = halfSteps * seg.majorStep;
  const candidates = labeled.filter((m) => m + dist <= seg.max && marks.includes(m + dist / 2));
  const left = candidates.length > 0 ? rng.pick(candidates) : seg.min;
  const right = left + dist <= seg.max ? left + dist : seg.max;
  const mid = Math.round((left + right) / 2);

  const faults: TaskFaultCandidate[] = [
    { category: 'Z2_schrittweite_falsch', answer: mid + seg.step },
    { category: 'Z2_schrittweite_falsch', answer: mid - seg.step },
    { category: 'Z4_beschriftung_gelesen', answer: left },
    { category: 'Z4_beschriftung_gelesen', answer: right },
  ];
  addNumberLineReversal(faults, mid);

  return {
    id,
    world: 2,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z2.zwischenzahl',
    type: 'zwischenzahl',
    promptText: `Welche Zahl liegt genau in der Mitte zwischen ${left} und ${right}?`,
    spokenPrompt: `Welche Zahl liegt genau in der Mitte zwischen ${left} und ${right}?`,
    helpText: `Hüpfe von ${left} und ${right} gleich viele Schritte zur Mitte!`,
    inputMode: 'single_number',
    fields: [
      {
        id: 'mid',
        label: 'Zahl in der Mitte',
        expected: mid,
        allowHundreds: mid >= 100,
        faults,
      },
    ],
    expectedValue: mid,
    numberLineContext: {
      min: seg.min,
      max: seg.max,
      step: seg.step,
      majorStep: seg.majorStep,
      labeledMarks: labeled,
      startMark: left,
      targetMark: mid,
      hopPath: [left, mid],
      betweenPair: [left, right],
    },
  };
}

const WORLD2_PLAN: Record<number, World2TaskType[]> = {
  1: ['strich_zu_zahl', 'zahl_zu_strich', 'strich_zaehlen', 'strich_zu_zahl', 'luecken_strahl', 'zahl_zu_strich', 'strich_zaehlen', 'zwischenzahl'],
  2: ['zahl_zu_strich', 'strich_zaehlen', 'strich_zu_zahl', 'zwischenzahl', 'luecken_strahl', 'strich_zaehlen', 'zahl_zu_strich', 'strich_zu_zahl'],
  3: ['strich_zu_zahl', 'strich_zaehlen', 'luecken_strahl', 'zahl_zu_strich', 'zwischenzahl', 'strich_zaehlen', 'strich_zu_zahl', 'luecken_strahl'],
  4: ['strich_zaehlen', 'zahl_zu_strich', 'zwischenzahl', 'strich_zu_zahl', 'luecken_strahl', 'strich_zaehlen', 'zahl_zu_strich', 'zwischenzahl'],
  5: ['strich_zu_zahl', 'luecken_strahl', 'strich_zaehlen', 'zwischenzahl', 'zahl_zu_strich', 'strich_zu_zahl', 'luecken_strahl', 'strich_zaehlen'],
  6: ['luecken_strahl', 'zwischenzahl', 'strich_zaehlen', 'zahl_zu_strich', 'strich_zu_zahl', 'luecken_strahl', 'strich_zaehlen', 'zwischenzahl'],
  7: ['strich_zaehlen', 'strich_zu_zahl', 'zwischenzahl', 'zahl_zu_strich', 'luecken_strahl', 'strich_zaehlen', 'zwischenzahl', 'luecken_strahl'],
  8: ['strich_zu_zahl', 'zahl_zu_strich', 'strich_zaehlen', 'luecken_strahl', 'zwischenzahl', 'strich_zaehlen', 'luecken_strahl', 'zwischenzahl'],
};

export function generateWorld2Level(
  level: number,
  seed: string | number,
  strichZaehlung: 'start_zaehlt_nicht' | 'start_ist_erster' = APP_CONFIG.defaultSettings.strichZaehlung
): MathTask[] {
  const safeLevel = Math.max(1, Math.min(8, level));
  const rng = createRng(`w2_l${safeLevel}_${seed}`);
  const plan = WORLD2_PLAN[safeLevel];
  const segments = getLevelSegments(safeLevel);
  const tasks: MathTask[] = [];
  const seenSigs = new Set<string>();

  for (let i = 0; i < plan.length; i++) {
    const taskType = plan[i];
    let task: MathTask | null = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const seg = segments[(i + attempt) % segments.length];
      const id = `w2_l${safeLevel}_t${i + 1}`;
      const candidate =
        taskType === 'strich_zu_zahl'
          ? generateStrichZuZahl(id, safeLevel, rng, seg)
          : taskType === 'zahl_zu_strich'
            ? generateZahlZuStrich(id, safeLevel, rng, seg)
            : taskType === 'strich_zaehlen'
              ? generateStrichZaehlen(id, safeLevel, rng, seg, strichZaehlung)
              : taskType === 'luecken_strahl'
                ? generateLueckenStrahl(id, safeLevel, rng, seg)
                : generateZwischenzahl(id, safeLevel, rng, seg);

      const sig = `${candidate.type}:${candidate.promptText}:${JSON.stringify(candidate.expectedValue)}`;
      if (!seenSigs.has(sig)) {
        seenSigs.add(sig);
        task = candidate;
        break;
      }
    }
    if (task) tasks.push(task);
  }

  return tasks;
}

export function evaluateWorld2Field(
  field: TaskFieldSpec,
  userValue: number
): { correct: boolean; categories: ReturnType<typeof matchAnswerToFaults> } {
  if (userValue === field.expected) {
    return { correct: true, categories: [] };
  }
  return {
    correct: false,
    categories: matchAnswerToFaults(userValue, field.faults),
  };
}

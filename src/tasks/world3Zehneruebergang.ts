import { createRng, type SeededRng } from '../core/rng';
import { matchAnswerToFaults, type TaskFaultCandidate } from '../diagnostics/errorModel';
import type { MathTask, World3TaskType } from './types';
import { reverseTwoDigits } from './world1Hundertertafel';

function addCalcFaults(
  faults: TaskFaultCandidate[],
  a: number,
  b: number,
  op: '+' | '-',
  expected: number
): void {
  const aTens = Math.floor(a / 10);
  const aOnes = a % 10;
  const bOnes = b % 10;

  if (op === '+') {
    // R1: Forgot carry to next ten (kept same ten)
    if (aOnes + bOnes >= 10) {
      faults.push({ category: 'R1_uebergang_ausgelassen', answer: aTens * 10 + ((aOnes + bOnes) % 10) });
      // R4: Stopped at the ten or forgot the remainder
      const nextTen = (aTens + 1) * 10;
      faults.push({ category: 'R4_rest_vergessen', answer: nextTen });
    }
    faults.push({ category: 'R3_rechenzeichen_vertauscht', answer: Math.max(0, a - b) });
    faults.push({ category: 'R2_zehner_statt_einer', answer: a + b * 10 });
  } else {
    // Minus across ten
    if (aOnes < bOnes) {
      // R5: Subtracted smaller ones from larger ones: e.g., 43 - 7 -> 44 (7-3=4)
      faults.push({ category: 'R5_kleine_minus_grosse', answer: aTens * 10 + (bOnes - aOnes) });
      // R1: Borrow forgotten -> 43 - 7 -> 46 or 40
      const prevTen = aTens * 10;
      faults.push({ category: 'R1_uebergang_ausgelassen', answer: prevTen + ((aOnes + 10 - bOnes) % 10) });
      faults.push({ category: 'R4_rest_vergessen', answer: prevTen });
    }
    faults.push({ category: 'R3_rechenzeichen_vertauscht', answer: a + b });
    faults.push({ category: 'R2_zehner_statt_einer', answer: Math.max(0, a - b * 10) });
  }

  faults.push({ category: 'R6_um_10_daneben', answer: expected + 10 });
  faults.push({ category: 'R6_um_10_daneben', answer: Math.max(0, expected - 10) });
  faults.push({ category: 'R7_um_1_daneben', answer: expected + 1 });
  faults.push({ category: 'R7_um_1_daneben', answer: Math.max(0, expected - 1) });

  const rev = reverseTwoDigits(expected);
  if (rev !== null && rev !== expected) {
    faults.push({ category: 'H7_zahlendreher', answer: rev });
  }
}

function generateUebergangPlus(id: string, level: number, rng: SeededRng): MathTask {
  const maxTen = level <= 2 ? 2 : level <= 5 ? 6 : 8;
  const tens = rng.int(1, maxTen);
  const ones = rng.int(4, 9);
  const a = tens * 10 + ones;
  const toNextTen = 10 - ones;
  const b = rng.int(toNextTen + 1, 9);
  const target = a + b;
  const nextTen = (tens + 1) * 10;
  const rest = b - toNextTen;

  const faults: TaskFaultCandidate[] = [];
  addCalcFaults(faults, a, b, '+', target);

  return {
    id,
    world: 3,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z3.uebergang_plus',
    type: 'uebergang_plus',
    promptText: `${a} + ${b} = ?`,
    spokenPrompt: `Wie viel ist ${a} plus ${b}? Hüpfe zuerst bis zur ${nextTen}!`,
    helpText: `Erst bis zum nächsten Zehner: ${a} + ${toNextTen} = ${nextTen}. Dann noch + ${rest}.`,
    inputMode: 'single_number',
    fields: [
      { id: 'sum', label: 'Ergebnis', expected: target, allowHundreds: target >= 100, faults },
    ],
    expectedValue: target,
    carryContext: {
      a,
      b,
      op: '+',
      target,
      intermediateTen: nextTen,
      firstJump: toNextTen,
      secondJump: rest,
      mode: 'calc',
    },
  };
}

function generateUebergangMinus(id: string, level: number, rng: SeededRng): MathTask {
  const minTen = level <= 2 ? 2 : 3;
  const maxTen = level <= 2 ? 3 : level <= 5 ? 7 : 9;
  const tens = rng.int(minTen, maxTen);
  const ones = rng.int(1, 5);
  const a = tens * 10 + ones;
  const b = rng.int(ones + 1, 9);
  const target = a - b;
  const prevTen = tens * 10;
  const rest = b - ones;

  const faults: TaskFaultCandidate[] = [];
  addCalcFaults(faults, a, b, '-', target);

  return {
    id,
    world: 3,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z3.uebergang_minus',
    type: 'uebergang_minus',
    promptText: `${a} − ${b} = ?`,
    spokenPrompt: `Wie viel ist ${a} minus ${b}? Hüpfe zuerst zurück bis zur ${prevTen}!`,
    helpText: `Erst zum Zehner zurück: ${a} − ${ones} = ${prevTen}. Dann noch − ${rest}.`,
    inputMode: 'single_number',
    fields: [
      { id: 'diff', label: 'Ergebnis', expected: target, faults },
    ],
    expectedValue: target,
    carryContext: {
      a,
      b,
      op: '-',
      target,
      intermediateTen: prevTen,
      firstJump: ones,
      secondJump: rest,
      mode: 'calc',
    },
  };
}

function generateErgaenzenZehner(id: string, level: number, rng: SeededRng): MathTask {
  const tens = rng.int(1, 8);
  const ones = rng.int(1, 9);
  const a = tens * 10 + ones;
  const nextTen = (tens + 1) * 10;
  const missing = nextTen - a;

  const faults: TaskFaultCandidate[] = [
    { category: 'R7_um_1_daneben', answer: missing + 1 },
    { category: 'R7_um_1_daneben', answer: Math.max(0, missing - 1) },
    { category: 'R6_um_10_daneben', answer: missing + 10 },
    { category: 'R1_uebergang_ausgelassen', answer: ones },
  ];

  return {
    id,
    world: 3,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z3.ergaenzen_zehner',
    type: 'ergaenzen_zehner',
    promptText: `${a} + ? = ${nextTen}`,
    spokenPrompt: `Wie viele fehlen von der ${a} bis zur ${nextTen}?`,
    helpText: `Denke an die verliebten Zahlen: ${ones} + ${missing} = 10.`,
    inputMode: 'single_number',
    fields: [{ id: 'comp', label: 'Fehlende Zahl', expected: missing, faults }],
    expectedValue: missing,
    carryContext: {
      a,
      b: missing,
      op: '+',
      target: nextTen,
      intermediateTen: nextTen,
      firstJump: missing,
      secondJump: 0,
      mode: 'complement_ten',
    },
  };
}

function generateErgaenzen100(id: string, level: number, rng: SeededRng): MathTask {
  const tens = rng.int(2, 8);
  const ones = level <= 4 ? rng.pick([0, 5]) : rng.int(1, 9);
  const a = tens * 10 + ones;
  const missing = 100 - a;
  const nextTen = ones === 0 ? a : (tens + 1) * 10;
  const firstStep = nextTen - a;
  const secondStep = 100 - nextTen;

  const faults: TaskFaultCandidate[] = [
    // Classic 100 complement error: 65 + 45 = 100 (forgot carry ten!)
    { category: 'R1_uebergang_ausgelassen', answer: ones === 0 ? missing : (10 - tens) * 10 + (10 - ones) },
    { category: 'R6_um_10_daneben', answer: missing + 10 },
    { category: 'R6_um_10_daneben', answer: Math.max(0, missing - 10) },
    { category: 'R7_um_1_daneben', answer: missing + 1 },
  ];
  const rev = reverseTwoDigits(missing);
  if (rev !== null && rev !== missing) {
    faults.push({ category: 'H7_zahlendreher', answer: rev });
  }

  return {
    id,
    world: 3,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z3.ergaenzen_100',
    type: 'ergaenzen_100',
    promptText: `${a} + ? = 100`,
    spokenPrompt: `Wie viel fehlt von ${a} bis 100?`,
    helpText:
      ones === 0
        ? `Zähle in Zehnerschritten von ${a} bis 100.`
        : `Erst bis ${nextTen} (+${firstStep}), dann bis 100 (+${secondStep}).`,
    inputMode: 'single_number',
    fields: [{ id: 'comp100', label: 'Bis 100 fehlen', expected: missing, faults }],
    expectedValue: missing,
    carryContext: {
      a,
      b: missing,
      op: '+',
      target: 100,
      intermediateTen: nextTen,
      firstJump: firstStep,
      secondJump: secondStep,
      mode: 'complement_100',
    },
  };
}

function generateZerlegen(id: string, level: number, rng: SeededRng): MathTask {
  const tens = rng.int(1, 7);
  const ones = rng.int(5, 9);
  const a = tens * 10 + ones;
  const firstJump = 10 - ones;
  const b = rng.int(firstJump + 1, 9);
  const secondJump = b - firstJump;
  const nextTen = (tens + 1) * 10;

  return {
    id,
    world: 3,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'z3.zerlegen',
    type: 'zerlegen',
    promptText: `Zerlege für ${a} + ${b}: Erst bis ${nextTen}, dann den Rest!`,
    spokenPrompt: `Zerlege die ${b} für ${a} plus ${b}. Wie groß ist der erste Sprung bis ${nextTen}, und was bleibt übrig?`,
    helpText: `Von ${a} bis ${nextTen} brauchst du ${firstJump}. Der Rest von ${b} ist ${secondJump}.`,
    inputMode: 'multi_fields',
    fields: [
      {
        id: 'step1',
        label: '1. Sprung zum Zehner',
        expected: firstJump,
        faults: [
          { category: 'R7_um_1_daneben', answer: firstJump + 1 },
          { category: 'R4_rest_vergessen', answer: secondJump },
        ],
      },
      {
        id: 'step2',
        label: '2. Sprung (Rest)',
        expected: secondJump,
        faults: [
          { category: 'R4_rest_vergessen', answer: b },
          { category: 'R7_um_1_daneben', answer: secondJump + 1 },
        ],
      },
    ],
    expectedValue: [firstJump, secondJump],
    carryContext: {
      a,
      b,
      op: '+',
      target: a + b,
      intermediateTen: nextTen,
      firstJump,
      secondJump,
      mode: 'decompose',
    },
  };
}

const WORLD3_PLAN: Record<number, World3TaskType[]> = {
  1: ['ergaenzen_zehner', 'uebergang_plus', 'ergaenzen_zehner', 'uebergang_plus', 'zerlegen', 'uebergang_plus', 'ergaenzen_zehner', 'uebergang_plus'],
  2: ['uebergang_plus', 'uebergang_minus', 'ergaenzen_zehner', 'zerlegen', 'uebergang_minus', 'uebergang_plus', 'uebergang_minus', 'ergaenzen_100'],
  3: ['uebergang_plus', 'uebergang_minus', 'zerlegen', 'ergaenzen_100', 'uebergang_plus', 'uebergang_minus', 'ergaenzen_zehner', 'uebergang_minus'],
  4: ['uebergang_minus', 'zerlegen', 'uebergang_plus', 'ergaenzen_100', 'uebergang_minus', 'uebergang_plus', 'zerlegen', 'ergaenzen_100'],
  5: ['ergaenzen_100', 'uebergang_plus', 'uebergang_minus', 'zerlegen', 'ergaenzen_100', 'uebergang_minus', 'uebergang_plus', 'ergaenzen_100'],
  6: ['uebergang_plus', 'uebergang_minus', 'ergaenzen_100', 'zerlegen', 'uebergang_minus', 'uebergang_plus', 'ergaenzen_100', 'uebergang_minus'],
  7: ['zerlegen', 'uebergang_minus', 'ergaenzen_100', 'uebergang_plus', 'uebergang_minus', 'ergaenzen_100', 'uebergang_plus', 'uebergang_minus'],
  8: ['uebergang_plus', 'uebergang_minus', 'ergaenzen_100', 'zerlegen', 'uebergang_plus', 'uebergang_minus', 'ergaenzen_100', 'uebergang_minus'],
};

export function generateWorld3Level(level: number, seed: string | number): MathTask[] {
  const safeLevel = Math.max(1, Math.min(8, level));
  const rng = createRng(`w3_l${safeLevel}_${seed}`);
  const plan = WORLD3_PLAN[safeLevel];
  const tasks: MathTask[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < plan.length; i++) {
    const tType = plan[i];
    let task: MathTask | null = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const id = `w3_l${safeLevel}_t${i + 1}`;
      const cand =
        tType === 'uebergang_plus'
          ? generateUebergangPlus(id, safeLevel, rng)
          : tType === 'uebergang_minus'
            ? generateUebergangMinus(id, safeLevel, rng)
            : tType === 'ergaenzen_zehner'
              ? generateErgaenzenZehner(id, safeLevel, rng)
              : tType === 'ergaenzen_100'
                ? generateErgaenzen100(id, safeLevel, rng)
                : generateZerlegen(id, safeLevel, rng);

      const sig = `${cand.type}:${cand.promptText}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        task = cand;
        break;
      }
    }
    if (task) tasks.push(task);
  }
  return tasks;
}

export function evaluateWorld3Field(field: MathTask['fields'][number], userValue: number) {
  if (userValue === field.expected) return { correct: true, categories: [] };
  return { correct: false, categories: matchAnswerToFaults(userValue, field.faults) };
}

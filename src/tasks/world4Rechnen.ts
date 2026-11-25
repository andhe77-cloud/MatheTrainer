import { createRng, type SeededRng } from '../core/rng';
import { matchAnswerToFaults, type TaskFaultCandidate } from '../diagnostics/errorModel';
import type { MathTask, World4TaskType } from './types';
import { reverseTwoDigits } from './world1Hundertertafel';

function addWorkshopFaults(
  faults: TaskFaultCandidate[],
  a: number,
  b: number,
  op: '+' | '-',
  expected: number
): void {
  const aTens = Math.floor(a / 10);
  const aOnes = a % 10;
  const bTens = Math.floor(b / 10);
  const bOnes = b % 10;

  if (op === '+') {
    faults.push({ category: 'R3_rechenzeichen_vertauscht', answer: Math.max(0, a - b) });
    if (b < 10) {
      // R2: Added ones to tens place
      faults.push({ category: 'R2_zehner_statt_einer', answer: a + b * 10 });
    }
    if (aOnes + bOnes >= 10) {
      faults.push({
        category: 'R1_uebergang_ausgelassen',
        answer: (aTens + bTens) * 10 + ((aOnes + bOnes) % 10),
      });
    }
  } else {
    faults.push({ category: 'R3_rechenzeichen_vertauscht', answer: a + b });
    if (b < 10) {
      faults.push({ category: 'R2_zehner_statt_einer', answer: Math.max(0, a - b * 10) });
    }
    if (aOnes < bOnes) {
      // R5: Kleine minus Große (swapped ones in subtraction)
      faults.push({
        category: 'R5_kleine_minus_grosse',
        answer: Math.max(0, (aTens - bTens) * 10 + (bOnes - aOnes)),
      });
    }
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

function generatePlusMinusEiner(id: string, level: number, rng: SeededRng): MathTask {
  const op: '+' | '-' = rng.next() < 0.5 ? '+' : '-';
  const tens = rng.int(1, 8);
  let a: number;
  let b: number;
  if (op === '+') {
    const aO = rng.int(1, 5);
    b = rng.int(1, 9 - aO);
    a = tens * 10 + aO;
  } else {
    const aO = rng.int(4, 9);
    b = rng.int(1, aO);
    a = tens * 10 + aO;
  }
  const result = op === '+' ? a + b : a - b;
  const faults: TaskFaultCandidate[] = [];
  addWorkshopFaults(faults, a, b, op, result);

  return {
    id,
    world: 4,
    level,
    difficulty: 1,
    skill: 'r4.plus_minus_einer',
    type: 'plus_minus_einer',
    promptText: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`,
    spokenPrompt: `Wie viel ist ${a} ${op === '+' ? 'plus' : 'minus'} ${b}?`,
    helpText: 'Die Zehner bleiben gleich — rechne zuerst nur die roten Einer!',
    inputMode: 'single_number',
    fields: [{ id: 'res', label: 'Ergebnis', expected: result, faults }],
    expectedValue: result,
    calcContext: {
      a,
      b,
      op,
      result,
      missingPos: 'result',
      strategyHint: 'Nur Einer verändern',
    },
  };
}

function generatePlusMinusZehner(id: string, level: number, rng: SeededRng): MathTask {
  const op: '+' | '-' = rng.next() < 0.55 ? '+' : '-';
  const fullTensOnly = level <= 2;
  let a: number;
  let b: number;
  if (fullTensOnly) {
    if (op === '+') {
      const tA = rng.int(1, 6);
      const tB = rng.int(1, 9 - tA);
      a = tA * 10;
      b = tB * 10;
    } else {
      const tA = rng.int(4, 9);
      const tB = rng.int(1, tA - 1);
      a = tA * 10;
      b = tB * 10;
    }
  } else {
    if (op === '+') {
      const tA = rng.int(1, 5);
      const tB = rng.int(1, 9 - tA);
      const oA = rng.int(1, 5);
      const oB = rng.int(1, 9 - oA);
      a = tA * 10 + oA;
      b = tB * 10 + oB;
    } else {
      const tA = rng.int(4, 9);
      const tB = rng.int(1, tA - 1);
      const oA = rng.int(4, 9);
      const oB = rng.int(1, oA);
      a = tA * 10 + oA;
      b = tB * 10 + oB;
    }
  }
  const result = op === '+' ? a + b : a - b;
  const faults: TaskFaultCandidate[] = [];
  addWorkshopFaults(faults, a, b, op, result);

  return {
    id,
    world: 4,
    level,
    difficulty: 2,
    skill: 'r4.plus_minus_zehner',
    type: 'plus_minus_zehner',
    promptText: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`,
    spokenPrompt: `Wie viel ist ${a} ${op === '+' ? 'plus' : 'minus'} ${b}?`,
    helpText: 'Rechne zuerst die blauen Zehner zusammen, dann die roten Einer.',
    inputMode: 'single_number',
    fields: [{ id: 'res', label: 'Ergebnis', expected: result, allowHundreds: result >= 100, faults }],
    expectedValue: result,
    calcContext: {
      a,
      b,
      op,
      result,
      missingPos: 'result',
      strategyHint: 'Zehner und Einer schrittweise',
    },
  };
}

function generateRechnenUebergang(id: string, level: number, rng: SeededRng): MathTask {
  const op: '+' | '-' = rng.next() < 0.5 ? '+' : '-';
  let a: number;
  let b: number;
  if (op === '+') {
    const tA = rng.int(1, 5);
    const tB = rng.int(1, 7 - tA);
    const oA = rng.int(5, 9);
    const oB = rng.int(10 - oA + 1, 9);
    a = tA * 10 + oA;
    b = tB * 10 + oB;
  } else {
    const tA = rng.int(4, 9);
    const tB = rng.int(1, tA - 2);
    const oA = rng.int(1, 4);
    const oB = rng.int(oA + 2, 9);
    a = tA * 10 + oA;
    b = tB * 10 + oB;
  }
  const result = op === '+' ? a + b : a - b;
  const faults: TaskFaultCandidate[] = [];
  addWorkshopFaults(faults, a, b, op, result);

  return {
    id,
    world: 4,
    level,
    difficulty: 4,
    skill: 'r4.rechnen_uebergang',
    type: 'rechnen_uebergang',
    promptText: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`,
    spokenPrompt: `Rechne geschickt: ${a} ${op === '+' ? 'plus' : 'minus'} ${b}.`,
    helpText: `Rechne erst die Zehner (${Math.floor(b / 10) * 10}), dann die Einer (${b % 10}) über den Zehner.`,
    inputMode: 'single_number',
    fields: [{ id: 'res', label: 'Ergebnis', expected: result, allowHundreds: result >= 100, faults }],
    expectedValue: result,
    calcContext: {
      a,
      b,
      op,
      result,
      missingPos: 'result',
      strategyHint: 'Erst Zehner, dann Einer',
    },
  };
}

function generateTauschUmkehr(id: string, level: number, rng: SeededRng): MathTask {
  const isSwap = rng.next() < 0.5;
  if (isSwap) {
    const small = rng.int(4, 9);
    const big = rng.int(22, 68);
    const result = small + big;
    const faults: TaskFaultCandidate[] = [];
    addWorkshopFaults(faults, small, big, '+', result);

    return {
      id,
      world: 4,
      level,
      difficulty: 3,
      skill: 'r4.tausch_umkehr',
      type: 'tausch_umkehr',
      promptText: `Tausch-Trick: ${small} + ${big} = ?`,
      spokenPrompt: `Nutze den Tausch-Trick: ${small} plus ${big}. Tausche die Zahlen im Kopf zu ${big} plus ${small}!`,
      helpText: `Bei Plus darfst du tauschen: ${big} + ${small} geht viel schneller!`,
      inputMode: 'single_number',
      fields: [{ id: 'res', label: 'Ergebnis', expected: result, faults }],
      expectedValue: result,
      calcContext: {
        a: small,
        b: big,
        op: '+',
        result,
        missingPos: 'result',
        strategyHint: 'Tauschaufgabe nutzen',
        helperEquation: `${big} + ${small} = ?`,
      },
    };
  }

  // Inverse task
  const part1 = rng.int(12, 48);
  const part2 = rng.int(11, 35);
  const sum = part1 + part2;
  const faults: TaskFaultCandidate[] = [];
  addWorkshopFaults(faults, sum, part1, '-', part2);

  return {
    id,
    world: 4,
    level,
    difficulty: 3,
    skill: 'r4.tausch_umkehr',
    type: 'tausch_umkehr',
    promptText: `Umkehraufgabe: Wenn ${part1} + ${part2} = ${sum}, dann ist ${sum} − ${part1} = ?`,
    spokenPrompt: `Umkehraufgabe: ${part1} plus ${part2} ist ${sum}. Wie viel ist dann ${sum} minus ${part1}?`,
    helpText: 'Minus dreht die Plus-Aufgabe genau um!',
    inputMode: 'single_number',
    fields: [{ id: 'res', label: 'Ergebnis', expected: part2, faults }],
    expectedValue: part2,
    calcContext: {
      a: sum,
      b: part1,
      op: '-',
      result: part2,
      missingPos: 'result',
      strategyHint: 'Umkehraufgabe',
      helperEquation: `${part1} + ${part2} = ${sum}`,
    },
  };
}

function generateVerdoppelnHalbieren(id: string, level: number, rng: SeededRng): MathTask {
  const isDouble = rng.next() < 0.55;
  if (isDouble) {
    const base = level <= 4 ? rng.int(6, 24) : rng.int(15, 48);
    const doubled = base * 2;
    const faults: TaskFaultCandidate[] = [
      { category: 'R1_uebergang_ausgelassen', answer: Math.floor(base / 10) * 10 + ((base % 10) * 2) % 10 },
      { category: 'R6_um_10_daneben', answer: doubled + 10 },
      { category: 'R7_um_1_daneben', answer: doubled + 1 },
      { category: 'R7_um_1_daneben', answer: doubled - 1 },
    ];
    return {
      id,
      world: 4,
      level,
      difficulty: 3,
      skill: 'r4.verdoppeln_halbieren',
      type: 'verdoppeln_halbieren',
      promptText: `Verdopple ${base}: ${base} + ${base} = ?`,
      spokenPrompt: `Verdopple die ${base}. Wie viel ist ${base} plus ${base}?`,
      helpText: `Verdopple zuerst die Zehner (${Math.floor(base / 10) * 20}) und dann die Einer (${(base % 10) * 2}).`,
      inputMode: 'single_number',
      fields: [{ id: 'dbl', label: 'Das Doppelte', expected: doubled, allowHundreds: doubled >= 100, faults }],
      expectedValue: doubled,
      calcContext: {
        a: base,
        b: base,
        op: '+',
        result: doubled,
        missingPos: 'result',
        strategyHint: 'Verdoppeln',
      },
    };
  }

  const half = level <= 4 ? rng.int(6, 24) : rng.int(15, 49);
  const whole = half * 2;
  const faults: TaskFaultCandidate[] = [
    { category: 'R6_um_10_daneben', answer: half + 10 },
    { category: 'R7_um_1_daneben', answer: half + 1 },
    { category: 'R7_um_1_daneben', answer: Math.max(0, half - 1) },
  ];
  return {
    id,
    world: 4,
    level,
    difficulty: 4,
    skill: 'r4.verdoppeln_halbieren',
    type: 'verdoppeln_halbieren',
    promptText: `Halbiere ${whole}: Welche Zahl ist die Hälfte?`,
    spokenPrompt: `Halbiere die ${whole}. Welche Zahl ist genau die Hälfte?`,
    helpText: `Teile ${whole} in zwei genau gleiche Teile.`,
    inputMode: 'single_number',
    fields: [{ id: 'half', label: 'Die Hälfte', expected: half, faults }],
    expectedValue: half,
    calcContext: {
      a: whole,
      b: half,
      op: '-',
      result: half,
      missingPos: 'right',
      strategyHint: 'Halbieren',
    },
  };
}

function generatePlatzhalter(id: string, level: number, rng: SeededRng): MathTask {
  const op: '+' | '-' = rng.next() < 0.6 ? '+' : '-';
  if (op === '+') {
    const a = rng.int(12, 48);
    const b = rng.int(8, 35);
    const result = a + b;
    const missingLeft = rng.next() < 0.5;
    const expected = missingLeft ? a : b;
    const faults: TaskFaultCandidate[] = [
      // Child added instead of finding missing addend!
      { category: 'R3_rechenzeichen_vertauscht', answer: result + (missingLeft ? b : a) },
      { category: 'R6_um_10_daneben', answer: expected + 10 },
      { category: 'R7_um_1_daneben', answer: expected + 1 },
    ];
    return {
      id,
      world: 4,
      level,
      difficulty: 5,
      skill: 'r4.platzhalter',
      type: 'platzhalter',
      promptText: missingLeft ? `? + ${b} = ${result}` : `${a} + ? = ${result}`,
      spokenPrompt: missingLeft ? `Welche Zahl plus ${b} ergibt ${result}?` : `${a} plus welche Zahl ergibt ${result}?`,
      helpText: `Nutze die Umkehraufgabe mit Minus: ${result} − ${missingLeft ? b : a}!`,
      inputMode: 'single_number',
      fields: [{ id: 'miss', label: 'Fehlende Zahl', expected, faults }],
      expectedValue: expected,
      calcContext: {
        a,
        b,
        op: '+',
        result,
        missingPos: missingLeft ? 'left' : 'right',
        strategyHint: 'Platzhalter finden',
      },
    };
  }

  const b = rng.int(11, 35);
  const result = rng.int(12, 45);
  const a = b + result;
  const faults: TaskFaultCandidate[] = [
    { category: 'R3_rechenzeichen_vertauscht', answer: Math.max(0, a - result) },
    { category: 'R6_um_10_daneben', answer: b + 10 },
    { category: 'R7_um_1_daneben', answer: b + 1 },
  ];
  return {
    id,
    world: 4,
    level,
    difficulty: 5,
    skill: 'r4.platzhalter',
    type: 'platzhalter',
    promptText: `${a} − ? = ${result}`,
    spokenPrompt: `${a} minus welche Zahl ergibt ${result}?`,
    helpText: `Wie groß ist der Sprung von ${result} bis ${a}?`,
    inputMode: 'single_number',
    fields: [{ id: 'miss', label: 'Fehlende Zahl', expected: b, faults }],
    expectedValue: b,
    calcContext: {
      a,
      b,
      op: '-',
      result,
      missingPos: 'right',
      strategyHint: 'Platzhalter bei Minus',
    },
  };
}

const WORLD4_PLAN: Record<number, World4TaskType[]> = {
  1: ['plus_minus_einer', 'plus_minus_einer', 'plus_minus_zehner', 'plus_minus_einer', 'tausch_umkehr', 'plus_minus_zehner', 'plus_minus_einer', 'verdoppeln_halbieren'],
  2: ['plus_minus_einer', 'plus_minus_zehner', 'tausch_umkehr', 'plus_minus_zehner', 'verdoppeln_halbieren', 'plus_minus_einer', 'plus_minus_zehner', 'tausch_umkehr'],
  3: ['plus_minus_zehner', 'tausch_umkehr', 'rechnen_uebergang', 'verdoppeln_halbieren', 'plus_minus_zehner', 'rechnen_uebergang', 'tausch_umkehr', 'verdoppeln_halbieren'],
  4: ['rechnen_uebergang', 'tausch_umkehr', 'verdoppeln_halbieren', 'rechnen_uebergang', 'plus_minus_zehner', 'platzhalter', 'rechnen_uebergang', 'tausch_umkehr'],
  5: ['rechnen_uebergang', 'verdoppeln_halbieren', 'platzhalter', 'rechnen_uebergang', 'tausch_umkehr', 'rechnen_uebergang', 'verdoppeln_halbieren', 'platzhalter'],
  6: ['rechnen_uebergang', 'platzhalter', 'verdoppeln_halbieren', 'rechnen_uebergang', 'tausch_umkehr', 'platzhalter', 'rechnen_uebergang', 'verdoppeln_halbieren'],
  7: ['platzhalter', 'rechnen_uebergang', 'verdoppeln_halbieren', 'platzhalter', 'rechnen_uebergang', 'tausch_umkehr', 'rechnen_uebergang', 'platzhalter'],
  8: ['rechnen_uebergang', 'platzhalter', 'verdoppeln_halbieren', 'tausch_umkehr', 'rechnen_uebergang', 'platzhalter', 'verdoppeln_halbieren', 'rechnen_uebergang'],
};

export function generateWorld4Level(
  level: number,
  seed: string | number,
  zehneruebergangEnabled = true
): MathTask[] {
  const safeLevel = Math.max(1, Math.min(8, level));
  const rng = createRng(`w4_l${safeLevel}_${seed}`);
  const plan = WORLD4_PLAN[safeLevel];
  const tasks: MathTask[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < plan.length; i++) {
    let tType = plan[i];
    if (!zehneruebergangEnabled && tType === 'rechnen_uebergang') {
      tType = 'plus_minus_zehner';
    }
    let task: MathTask | null = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const id = `w4_l${safeLevel}_t${i + 1}`;
      const cand =
        tType === 'plus_minus_einer'
          ? generatePlusMinusEiner(id, safeLevel, rng)
          : tType === 'plus_minus_zehner'
            ? generatePlusMinusZehner(id, safeLevel, rng)
            : tType === 'rechnen_uebergang'
              ? generateRechnenUebergang(id, safeLevel, rng)
              : tType === 'tausch_umkehr'
                ? generateTauschUmkehr(id, safeLevel, rng)
                : tType === 'verdoppeln_halbieren'
                  ? generateVerdoppelnHalbieren(id, safeLevel, rng)
                  : generatePlatzhalter(id, safeLevel, rng);

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

export function evaluateWorld4Field(field: MathTask['fields'][number], userValue: number) {
  if (userValue === field.expected) return { correct: true, categories: [] };
  return { correct: false, categories: matchAnswerToFaults(userValue, field.faults) };
}

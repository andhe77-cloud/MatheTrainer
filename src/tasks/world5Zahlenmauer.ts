import { createRng, type SeededRng } from '../core/rng';
import { matchAnswerToFaults, type TaskFaultCandidate } from '../diagnostics/errorModel';
import type { MathTask, NumberWallBrick, TaskFieldSpec } from './types';

function buildWallValues(tiers: 3 | 4, maxTop: number, rng: SeededRng): number[][] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const baseLen = tiers;
    const minBase = maxTop <= 20 ? 1 : 3;
    const maxBase = maxTop <= 20 ? 7 : tiers === 4 ? 18 : 28;
    const bottom = Array.from({ length: baseLen }, () => rng.int(minBase, maxBase));
    const rows: number[][] = [bottom];
    for (let r = 1; r < tiers; r++) {
      const prev = rows[r - 1];
      const next: number[] = [];
      for (let c = 0; c < prev.length - 1; c++) {
        next.push(prev[c] + prev[c + 1]);
      }
      rows.push(next);
    }
    const topVal = rows[rows.length - 1][0];
    if (topVal <= maxTop && topVal >= (maxTop <= 20 ? 8 : 20)) {
      return rows;
    }
  }
  // Safe deterministic fallback
  return tiers === 3
    ? maxTop <= 20
      ? [
          [3, 4, 5],
          [7, 9],
          [16],
        ]
      : [
          [14, 18, 22],
          [32, 40],
          [72],
        ]
    : [
        [6, 8, 10, 7],
        [14, 18, 17],
        [32, 35],
        [67],
      ];
}

function makeWallTask(
  id: string,
  level: number,
  tiers: 3 | 4,
  maxTop: number,
  rng: SeededRng
): MathTask {
  const values = buildWallValues(tiers, maxTop, rng);
  const rows: NumberWallBrick[][] = values.map((rowVals, r) =>
    rowVals.map((val, c) => ({
      id: `b_${r}_${c}`,
      row: r,
      col: c,
      value: val,
      isMissing: false,
    }))
  );

  // Pick missing pattern:
  // Early levels: missing top/middle; later levels: mixed base/middle/top (solving with subtraction!)
  const missingCoords: Array<{ r: number; c: number }> = [];
  if (tiers === 3) {
    if (level <= 2) {
      // Standard upward addition
      missingCoords.push({ r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 });
    } else if (level <= 4) {
      // Reverse / mixed missing (tests M1 & M2!)
      const pattern = rng.int(0, 2);
      if (pattern === 0) missingCoords.push({ r: 0, c: 1 }, { r: 1, c: 1 }, { r: 2, c: 0 });
      else if (pattern === 1) missingCoords.push({ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 });
      else missingCoords.push({ r: 1, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 });
    } else {
      missingCoords.push({ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 2, c: 0 });
    }
  } else {
    // 4-tier wall: 4-5 missing bricks across rows
    if (level <= 6) {
      missingCoords.push({ r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 3, c: 0 });
    } else {
      missingCoords.push({ r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 3, c: 0 });
    }
  }

  for (const mc of missingCoords) {
    rows[mc.r][mc.c].isMissing = true;
  }

  // Sort fields bottom-to-top, left-to-right so child builds naturally upward
  const missingBricks = missingCoords
    .sort((a, b) => (a.r !== b.r ? a.r - b.r : a.c - b.c))
    .map((mc) => rows[mc.r][mc.c]);

  const fields: TaskFieldSpec[] = missingBricks.map((brick, idx) => {
    const faults: TaskFaultCandidate[] = [];
    if (brick.row > 0) {
      const leftChild = rows[brick.row - 1][brick.col].value;
      const rightChild = rows[brick.row - 1][brick.col + 1].value;
      // M1: Subtracted instead of added!
      faults.push({ category: 'M1_mauer_falschrum', answer: Math.abs(leftChild - rightChild) });
      // M2: Copied only one neighbor
      faults.push({ category: 'M2_nur_ein_nachbar', answer: leftChild });
      faults.push({ category: 'M2_nur_ein_nachbar', answer: rightChild });
      if (maxTop <= 20) {
        faults.push({ category: 'M3_grundrechenfehler_20', answer: brick.value + 1 });
        faults.push({ category: 'M3_grundrechenfehler_20', answer: Math.max(0, brick.value - 1) });
      } else {
        faults.push({ category: 'R1_uebergang_ausgelassen', answer: Math.max(0, brick.value - 10) });
      }
    } else {
      // Bottom row brick deduced from parent minus sibling!
      const parentCol = brick.col < rows[1].length ? brick.col : brick.col - 1;
      const parentVal = rows[1][parentCol].value;
      const siblingCol = brick.col === parentCol ? brick.col + 1 : brick.col - 1;
      const siblingVal = rows[0][siblingCol].value;
      // M1: Added parent + sibling instead of subtracting!
      faults.push({ category: 'M1_mauer_falschrum', answer: parentVal + siblingVal });
      // M2: Copied parent or sibling directly
      faults.push({ category: 'M2_nur_ein_nachbar', answer: parentVal });
      faults.push({ category: 'M2_nur_ein_nachbar', answer: siblingVal });
      if (maxTop <= 20) {
        faults.push({ category: 'M3_grundrechenfehler_20', answer: brick.value + 1 });
      }
    }

    return {
      id: brick.id,
      label: `Stein ${idx + 1}`,
      expected: brick.value,
      brickId: brick.id,
      allowHundreds: brick.value >= 100,
      faults,
    };
  });

  const type = tiers === 4 ? 'mauer_4' : maxTop <= 20 ? 'mauer_3_bis_20' : 'mauer_3_bis_100';
  const skill =
    tiers === 4 ? 'm5.mauer_4' : maxTop <= 20 ? 'm5.mauer_3_20' : 'm5.mauer_3_100';

  return {
    id,
    world: 5,
    level,
    difficulty: tiers === 4 ? 5 : maxTop <= 20 ? 1 : 3,
    skill,
    type,
    promptText: 'Baue die Zahlenmauer fertig! Zwei Steine ergeben zusammen den Stein darüber.',
    spokenPrompt: 'Baue die Zahlenmauer fertig! Zwei Steine nebeneinander ergeben zusammen den Stein genau darüber.',
    helpText: 'Tippe auf einen ?-Stein. Unten + unten = oben darüber!',
    inputMode: 'multi_fields',
    fields,
    expectedValue: fields.map((f) => f.expected),
    wallContext: {
      rows,
      targetTop: values[values.length - 1][0],
    },
  };
}

export function generateWorld5Level(level: number, seed: string | number): MathTask[] {
  const safeLevel = Math.max(1, Math.min(8, level));
  const rng = createRng(`w5_l${safeLevel}_${seed}`);
  const tasks: MathTask[] = [];
  const seen = new Set<string>();

  // O3 Progression: Levels 1-2 = 3-tier <=20; Levels 3-5 = 3-tier <=100; Levels 6-8 = 4-tier <=100
  const tiers: 3 | 4 = safeLevel >= 6 ? 4 : 3;
  const maxTop = safeLevel <= 2 ? 20 : 100;

  for (let i = 0; i < 6; i++) {
    let task: MathTask | null = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const cand = makeWallTask(`w5_l${safeLevel}_t${i + 1}`, safeLevel, tiers, maxTop, rng);
      const sig = JSON.stringify(cand.expectedValue);
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

export function evaluateWorld5Field(field: MathTask['fields'][number], userValue: number) {
  if (userValue === field.expected) return { correct: true, categories: [] };
  return { correct: false, categories: matchAnswerToFaults(userValue, field.faults) };
}

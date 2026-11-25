import { APP_CONFIG } from '../content/config';
import { createRng, type SeededRng } from '../core/rng';
import type { ErrorCategoryCode } from '../core/types';
import { matchAnswerToFaults, type TaskFaultCandidate } from '../diagnostics/errorModel';
import type { MathTask, TaskFieldSpec, World1TaskType } from './types';

export function getBoardCoords(num: number, tafelStart: 1 | 0): { row: number; col: number } {
  const idx = num - tafelStart;
  return {
    row: Math.floor(idx / 10) + 1,
    col: (idx % 10) + 1,
  };
}

export function coordsToNumber(row: number, col: number, tafelStart: 1 | 0): number {
  return (row - 1) * 10 + (col - 1) + tafelStart;
}

export function isValidBoardNumber(num: number, tafelStart: 1 | 0): boolean {
  return num >= tafelStart && num <= tafelStart + 99;
}

export function reverseTwoDigits(n: number): number | null {
  if (n < 10 || n > 99) return null;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  if (tens === ones) return null;
  return ones * 10 + tens;
}

export function buildBoardHopPath(from: number, to: number, tafelStart: 1 | 0): number[] {
  if (!isValidBoardNumber(from, tafelStart) || !isValidBoardNumber(to, tafelStart)) {
    return [to];
  }
  const path: number[] = [from];
  let curr = from;
  const target = getBoardCoords(to, tafelStart);
  let { row, col } = getBoardCoords(curr, tafelStart);

  // Move vertically by 10s first
  while (row !== target.row) {
    row += row < target.row ? 1 : -1;
    curr = coordsToNumber(row, col, tafelStart);
    path.push(curr);
  }
  // Then move horizontally by 1s
  while (col !== target.col) {
    col += col < target.col ? 1 : -1;
    curr = coordsToNumber(row, col, tafelStart);
    path.push(curr);
  }
  return path;
}

function addDigitReversalFault(faults: TaskFaultCandidate[], expected: number): void {
  const rev = reverseTwoDigits(expected);
  if (rev !== null && rev !== expected) {
    faults.push({ category: 'H7_zahlendreher', answer: rev });
  }
}

function makeNeighborFaults(center: number, dir: 'up' | 'down' | 'left' | 'right', expected: number, tafelStart: 1 | 0): TaskFaultCandidate[] {
  const faults: TaskFaultCandidate[] = [];
  if (dir === 'up') {
    faults.push({ category: 'H1_oben_unten', answer: center + 10 });
    faults.push({ category: 'H4_plus1_vs_plus10', answer: center - 1 });
  } else if (dir === 'down') {
    faults.push({ category: 'H1_oben_unten', answer: center - 10 });
    faults.push({ category: 'H4_plus1_vs_plus10', answer: center + 1 });
  } else if (dir === 'left') {
    faults.push({ category: 'H2_links_rechts', answer: center + 1 });
    faults.push({ category: 'H4_plus1_vs_plus10', answer: center - 10 });
    if (getBoardCoords(center, tafelStart).col === 1) {
      faults.push({ category: 'H5_zeilenumbruch', answer: center + 9 });
    }
  } else if (dir === 'right') {
    faults.push({ category: 'H2_links_rechts', answer: center - 1 });
    faults.push({ category: 'H4_plus1_vs_plus10', answer: center + 10 });
    if (getBoardCoords(center, tafelStart).col === 10) {
      faults.push({ category: 'H5_zeilenumbruch', answer: center - 9 });
    }
  }
  addDigitReversalFault(faults, expected);
  return faults;
}

function generateNachbar4Task(id: string, level: number, rng: SeededRng, tafelStart: 1 | 0): MathTask {
  const row = rng.int(2, 9);
  const col = rng.int(2, 9);
  const center = coordsToNumber(row, col, tafelStart);
  const up = center - 10;
  const left = center - 1;
  const right = center + 1;
  const down = center + 10;

  const fields: TaskFieldSpec[] = [
    { id: 'up', label: 'Oben', arrow: 'up', expected: up, row: row - 1, col, faults: makeNeighborFaults(center, 'up', up, tafelStart) },
    { id: 'left', label: 'Links', arrow: 'left', expected: left, row, col: col - 1, faults: makeNeighborFaults(center, 'left', left, tafelStart) },
    { id: 'right', label: 'Rechts', arrow: 'right', expected: right, row, col: col + 1, faults: makeNeighborFaults(center, 'right', right, tafelStart) },
    { id: 'down', label: 'Unten', arrow: 'down', expected: down, row: row + 1, col, faults: makeNeighborFaults(center, 'down', down, tafelStart) },
  ];

  return {
    id,
    world: 1,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'h100.nachbar_4',
    type: 'nachbar_4',
    promptText: `Welche Zahlen liegen um die ${center} (oben, links, rechts, unten)?`,
    spokenPrompt: `Welche Zahlen liegen um die ${center}? Oben, links, rechts und unten.`,
    helpText: 'Nach links und rechts sind es 1er-Schritte, nach oben und unten 10er-Schritte.',
    inputMode: 'multi_fields',
    fields,
    expectedValue: [up, left, right, down],
    boardContext: {
      tafelStart,
      startCell: center,
      targetCell: down,
      hopPath: [center, up, center, left, center, right, center, down],
      givenCells: [center],
      cutoutRange: { minRow: row - 1, maxRow: row + 1, minCol: col - 1, maxCol: col + 1 },
    },
  };
}

function generateUmgebung8Task(id: string, level: number, rng: SeededRng, tafelStart: 1 | 0): MathTask {
  const row = rng.int(2, 9);
  const col = rng.int(2, 9);
  const center = coordsToNumber(row, col, tafelStart);

  const offsets: Array<{ id: string; dr: number; dc: number; label: string; arrow: TaskFieldSpec['arrow'] }> = [
    { id: 'tl', dr: -1, dc: -1, label: 'Oben links', arrow: 'diag' },
    { id: 't', dr: -1, dc: 0, label: 'Oben', arrow: 'up' },
    { id: 'tr', dr: -1, dc: 1, label: 'Oben rechts', arrow: 'diag' },
    { id: 'l', dr: 0, dc: -1, label: 'Links', arrow: 'left' },
    { id: 'r', dr: 0, dc: 1, label: 'Rechts', arrow: 'right' },
    { id: 'bl', dr: 1, dc: -1, label: 'Unten links', arrow: 'diag' },
    { id: 'b', dr: 1, dc: 0, label: 'Unten', arrow: 'down' },
    { id: 'br', dr: 1, dc: 1, label: 'Unten rechts', arrow: 'diag' },
  ];

  const fields: TaskFieldSpec[] = offsets.map((o) => {
    const exp = coordsToNumber(row + o.dr, col + o.dc, tafelStart);
    const faults: TaskFaultCandidate[] = [];
    if (o.dr !== 0 && o.dc === 0) {
      faults.push(...makeNeighborFaults(center, o.dr < 0 ? 'up' : 'down', exp, tafelStart));
    } else if (o.dr === 0 && o.dc !== 0) {
      faults.push(...makeNeighborFaults(center, o.dc < 0 ? 'left' : 'right', exp, tafelStart));
    } else {
      // Diagonal neighbor: common faults are swapping ±10 / ±1 signs or digit reversal
      faults.push({ category: 'H1_oben_unten', answer: coordsToNumber(row - o.dr, col + o.dc, tafelStart) });
      faults.push({ category: 'H2_links_rechts', answer: coordsToNumber(row + o.dr, col - o.dc, tafelStart) });
      addDigitReversalFault(faults, exp);
    }
    return {
      id: o.id,
      label: o.label,
      arrow: o.arrow,
      expected: exp,
      row: row + o.dr,
      col: col + o.dc,
      allowHundreds: exp >= 100,
      faults,
    };
  });

  return {
    id,
    world: 1,
    level,
    difficulty: 4,
    skill: 'h100.umgebung_8',
    type: 'umgebung_8',
    promptText: `Finde alle 8 Nachbarn rund um die ${center}!`,
    spokenPrompt: `Finde alle 8 Nachbarn rund um die ${center}.`,
    helpText: 'Schau dir zuerst die oberen 3 Zahlen, dann links und rechts, dann die unteren 3 an.',
    inputMode: 'multi_fields',
    fields,
    expectedValue: fields.map((f) => f.expected),
    boardContext: {
      tafelStart,
      startCell: center,
      targetCell: center + 11,
      hopPath: [center, center - 10, center + 10],
      givenCells: [center],
      cutoutRange: { minRow: row - 1, maxRow: row + 1, minCol: col - 1, maxCol: col + 1 },
    },
  };
}

function generateWegTask(id: string, level: number, rng: SeededRng, tafelStart: 1 | 0): MathTask {
  // Levels 1-2: mostly single axis or simple 2-step; Level 6+: include row wrap boundary!
  let startRow: number;
  let startCol: number;
  let dRow: number;
  let dCol: number;
  let includeBoundaryWrap = false;

  if (level >= 6 && rng.next() < 0.45) {
    // Explicit row-boundary crossing (H5 test!) e.g., from col 9 or 10 wrapping +1 into next row
    includeBoundaryWrap = true;
    startRow = rng.int(2, 7);
    startCol = rng.pick([9, 10]);
    dRow = rng.pick([-1, 0, 1]);
    dCol = rng.int(1, 2);
  } else {
    startRow = rng.int(3, 8);
    startCol = rng.int(3, 8);
    if (level <= 2) {
      const verticalOnly = rng.next() < 0.5;
      dRow = verticalOnly ? rng.pick([-2, -1, 1, 2]) : 0;
      dCol = verticalOnly ? 0 : rng.pick([-2, -1, 1, 2]);
    } else {
      dRow = rng.pick([-2, -1, 1, 2]);
      dCol = rng.pick([-3, -2, -1, 1, 2, 3]);
    }
  }

  const startNum = coordsToNumber(startRow, startCol, tafelStart);
  let targetNum = startNum + dRow * 10 + dCol;
  if (!isValidBoardNumber(targetNum, tafelStart)) {
    dRow = -dRow;
    targetNum = startNum + dRow * 10 + dCol;
  }

  const parts: string[] = [];
  if (dRow !== 0) {
    parts.push(`${Math.abs(dRow)} nach ${dRow < 0 ? 'oben' : 'unten'}`);
  }
  if (dCol !== 0) {
    parts.push(`${Math.abs(dCol)} nach ${dCol > 0 ? 'rechts' : 'links'}`);
  }
  const dirPhrase = parts.join(', ');
  const promptText = `Starte bei ${startNum}. ${dirPhrase}. Wo landest du?`;

  const faults: TaskFaultCandidate[] = [];
  if (dRow !== 0) {
    faults.push({ category: 'H1_oben_unten', answer: startNum - dRow * 10 + dCol });
  }
  if (dCol !== 0) {
    faults.push({ category: 'H2_links_rechts', answer: startNum + dRow * 10 - dCol });
  }
  // ±1 vs ±10 swapped!
  faults.push({ category: 'H4_plus1_vs_plus10', answer: startNum + dCol * 10 + dRow });
  // Start field counted (off by 1 step toward target)
  const offBy1 =
    dCol !== 0
      ? targetNum - Math.sign(dCol)
      : targetNum - Math.sign(dRow) * 10;
  if (offBy1 !== targetNum) {
    faults.push({ category: 'H6_startfeld_mitgezaehlt', answer: offBy1 });
  }
  if (includeBoundaryWrap) {
    // Classic H5 error: staying in the same row / forgetting row wrap (-10 off)
    faults.push({ category: 'H5_zeilenumbruch', answer: targetNum - 10 });
    faults.push({ category: 'H5_zeilenumbruch', answer: startNum + dRow * 10 });
  }
  addDigitReversalFault(faults, targetNum);

  const hopPath = includeBoundaryWrap
    ? Array.from({ length: Math.abs(dCol) + 1 }, (_, i) => startNum + dRow * 10 + i * Math.sign(dCol))
    : buildBoardHopPath(startNum, targetNum, tafelStart);

  return {
    id,
    world: 1,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'h100.weg',
    type: 'weg',
    promptText,
    spokenPrompt: promptText,
    helpText: 'Jeder Schritt nach oben oder unten ändert die Zehner, nach links oder rechts ändert die Einer.',
    inputMode: 'single_number',
    fields: [
      {
        id: 'target',
        label: 'Zielzahl',
        expected: targetNum,
        allowHundreds: targetNum >= 100,
        faults,
      },
    ],
    expectedValue: targetNum,
    boardContext: {
      tafelStart,
      startCell: startNum,
      targetCell: targetNum,
      hopPath,
      givenCells: [startNum],
    },
  };
}

function generateZeileSpalteTask(id: string, level: number, rng: SeededRng, tafelStart: 1 | 0): MathTask {
  const row = rng.int(1, 9);
  const col = rng.int(1, 9);
  // Avoid row === col so H3_zeile_spalte is cleanly detectable
  const safeCol = col === row ? ((col % 9) + 1) : col;
  const targetNum = coordsToNumber(row, safeCol, tafelStart);
  const reverseAsk = level >= 4 && rng.next() < 0.45;

  if (reverseAsk) {
    const faultsRow: TaskFaultCandidate[] = [
      { category: 'H3_zeile_spalte', answer: safeCol },
      { category: 'H6_startfeld_mitgezaehlt', answer: row + 1 },
    ];
    const faultsCol: TaskFaultCandidate[] = [
      { category: 'H3_zeile_spalte', answer: row },
      { category: 'H6_startfeld_mitgezaehlt', answer: safeCol + 1 },
    ];
    return {
      id,
      world: 1,
      level,
      difficulty: 3,
      skill: 'h100.zeile_spalte',
      type: 'zeile_spalte',
      promptText: `Wo steht die ${targetNum}? Schreibe Zeile und Spalte.`,
      spokenPrompt: `In welcher Zeile und welcher Spalte steht die ${targetNum}?`,
      helpText: 'Zähle die Zeilen von oben nach unten (1 bis 10) und die Spalten von links nach rechts.',
      inputMode: 'multi_fields',
      fields: [
        { id: 'row', label: 'Zeile', expected: row, faults: faultsRow },
        { id: 'col', label: 'Spalte', expected: safeCol, faults: faultsCol },
      ],
      expectedValue: [row, safeCol],
      boardContext: {
        tafelStart,
        startCell: coordsToNumber(row, 1, tafelStart),
        targetCell: targetNum,
        hopPath: buildBoardHopPath(coordsToNumber(row, 1, tafelStart), targetNum, tafelStart),
        givenCells: [targetNum],
      },
    };
  }

  const swappedNum = coordsToNumber(safeCol, row, tafelStart);
  const faults: TaskFaultCandidate[] = [
    { category: 'H3_zeile_spalte', answer: swappedNum },
    { category: 'H6_startfeld_mitgezaehlt', answer: coordsToNumber(row + 1, safeCol, tafelStart) },
    { category: 'H6_startfeld_mitgezaehlt', answer: coordsToNumber(row, safeCol + 1, tafelStart) },
  ];
  addDigitReversalFault(faults, targetNum);

  return {
    id,
    world: 1,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'h100.zeile_spalte',
    type: 'zeile_spalte',
    promptText: `Welche Zahl steht in der ${row}. Zeile, ${safeCol}. Spalte?`,
    spokenPrompt: `Welche Zahl steht in der ${row}. Zeile und ${safeCol}. Spalte?`,
    helpText: `Starte links in der ${row}. Zeile und hüpfe bis zur ${safeCol}. Spalte!`,
    inputMode: 'single_number',
    fields: [
      {
        id: 'target',
        label: 'Zahl',
        expected: targetNum,
        allowHundreds: targetNum >= 100,
        faults,
      },
    ],
    expectedValue: targetNum,
    boardContext: {
      tafelStart,
      startCell: coordsToNumber(row, 1, tafelStart),
      targetCell: targetNum,
      hopPath: buildBoardHopPath(coordsToNumber(row, 1, tafelStart), targetNum, tafelStart),
      givenCells: [],
    },
  };
}

function generateLueckenTask(id: string, level: number, rng: SeededRng, tafelStart: 1 | 0): MathTask {
  const minRow = rng.int(1, 8);
  const minCol = rng.int(1, 8);
  const maxRow = minRow + 2;
  const maxCol = minCol + 2;
  const allCells: Array<{ row: number; col: number; num: number }> = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      allCells.push({ row: r, col: c, num: coordsToNumber(r, c, tafelStart) });
    }
  }

  const gapCount = level <= 3 ? 2 : 3;
  // Pick a visible anchor cell first (e.g., center or top-left) so cutout is unambiguous
  const anchor = allCells[0];
  const candidateGaps = rng.shuffle(allCells.slice(1)).slice(0, gapCount);
  const gapSet = new Set(candidateGaps.map((g) => g.num));
  const givenCells = allCells.filter((c) => !gapSet.has(c.num)).map((c) => c.num);

  const fields: TaskFieldSpec[] = candidateGaps
    .sort((a, b) => a.num - b.num)
    .map((g, idx) => {
      const faults: TaskFaultCandidate[] = [
        { category: 'H4_plus1_vs_plus10', answer: g.num + 9 },
        { category: 'H4_plus1_vs_plus10', answer: g.num - 9 },
        { category: 'H1_oben_unten', answer: g.num + 10 },
        { category: 'H2_links_rechts', answer: g.num + 1 },
      ];
      addDigitReversalFault(faults, g.num);
      return {
        id: `gap_${idx}`,
        label: `Lücke ${idx + 1}`,
        expected: g.num,
        row: g.row,
        col: g.col,
        allowHundreds: g.num >= 100,
        faults,
      };
    });

  return {
    id,
    world: 1,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'h100.luecken',
    type: 'luecken',
    promptText: 'Fülle die leeren Felder im Ausschnitt der Bauplatte!',
    spokenPrompt: 'Fülle die leeren Felder im Ausschnitt der Bauplatte.',
    helpText: 'Schau auf die Nachbarzahlen im Ausschnitt: rechts +1, unten +10.',
    inputMode: 'multi_fields',
    fields,
    expectedValue: fields.map((f) => f.expected),
    boardContext: {
      tafelStart,
      startCell: anchor.num,
      targetCell: fields[fields.length - 1].expected,
      hopPath: buildBoardHopPath(anchor.num, fields[fields.length - 1].expected, tafelStart),
      givenCells,
      cutoutRange: { minRow, maxRow, minCol, maxCol },
    },
  };
}

function generateZahlFindenTask(id: string, level: number, rng: SeededRng, tafelStart: 1 | 0): MathTask {
  const row = rng.int(2, 9);
  const col = rng.int(2, 9);
  const tapNum = coordsToNumber(row, col, tafelStart);
  const dir = level <= 3 ? 'right' : rng.pick(['right', 'left', 'down', 'up'] as const);
  const delta = dir === 'right' ? 1 : dir === 'left' ? -1 : dir === 'down' ? 10 : -10;
  const dirWord = dir === 'right' ? 'rechts daneben' : dir === 'left' ? 'links daneben' : dir === 'down' ? 'darunter' : 'darüber';
  const expected = tapNum + delta;

  return {
    id,
    world: 1,
    level,
    difficulty: Math.min(5, Math.ceil(level / 2)),
    skill: 'h100.zahl_finden',
    type: 'zahl_finden',
    promptText: `Tippe auf die ${tapNum} und schreibe die Zahl ${dirWord}!`,
    spokenPrompt: `Tippe auf die ${tapNum} und schreibe dann die Zahl ${dirWord}.`,
    helpText: `Suche erst die ${tapNum} in der ${row}. Zeile, dann schaue ${dirWord}.`,
    inputMode: 'tap_board_then_number',
    fields: [
      {
        id: 'neighbor',
        label: `Zahl ${dirWord}`,
        arrow: dir,
        expected,
        row: getBoardCoords(expected, tafelStart).row,
        col: getBoardCoords(expected, tafelStart).col,
        allowHundreds: expected >= 100,
        faults: makeNeighborFaults(tapNum, dir, expected, tafelStart),
      },
    ],
    expectedValue: expected,
    boardContext: {
      tafelStart,
      startCell: tapNum,
      targetCell: expected,
      hopPath: [tapNum, expected],
      givenCells: [],
      tapTarget: tapNum,
    },
  };
}

const LEVEL_PLAN: Record<number, World1TaskType[]> = {
  1: ['zahl_finden', 'nachbar_4', 'zahl_finden', 'weg', 'nachbar_4', 'zeile_spalte', 'zahl_finden', 'weg'],
  2: ['weg', 'zeile_spalte', 'nachbar_4', 'zahl_finden', 'weg', 'zeile_spalte', 'luecken', 'nachbar_4'],
  3: ['nachbar_4', 'luecken', 'weg', 'zeile_spalte', 'luecken', 'weg', 'zahl_finden', 'nachbar_4'],
  4: ['zeile_spalte', 'luecken', 'weg', 'zahl_finden', 'zeile_spalte', 'luecken', 'nachbar_4', 'weg'],
  5: ['umgebung_8', 'weg', 'zeile_spalte', 'luecken', 'zahl_finden', 'umgebung_8', 'weg', 'luecken'],
  6: ['weg', 'umgebung_8', 'luecken', 'zeile_spalte', 'weg', 'zahl_finden', 'umgebung_8', 'weg'],
  7: ['zeile_spalte', 'weg', 'luecken', 'umgebung_8', 'weg', 'zahl_finden', 'luecken', 'zeile_spalte'],
  8: ['nachbar_4', 'weg', 'zeile_spalte', 'luecken', 'umgebung_8', 'zahl_finden', 'weg', 'umgebung_8'],
};

export function generateWorld1Level(
  level: number,
  seed: string | number,
  tafelStart: 1 | 0 = APP_CONFIG.defaultSettings.tafelStart
): MathTask[] {
  const safeLevel = Math.max(1, Math.min(8, level));
  const rng = createRng(`w1_l${safeLevel}_${seed}`);
  const plan = LEVEL_PLAN[safeLevel];
  const tasks: MathTask[] = [];
  const seenSignatures = new Set<string>();

  for (let i = 0; i < plan.length; i++) {
    const taskType = plan[i];
    let task: MathTask | null = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      const id = `w1_l${safeLevel}_t${i + 1}`;
      const candidate =
        taskType === 'nachbar_4'
          ? generateNachbar4Task(id, safeLevel, rng, tafelStart)
          : taskType === 'umgebung_8'
            ? generateUmgebung8Task(id, safeLevel, rng, tafelStart)
            : taskType === 'weg'
              ? generateWegTask(id, safeLevel, rng, tafelStart)
              : taskType === 'zeile_spalte'
                ? generateZeileSpalteTask(id, safeLevel, rng, tafelStart)
                : taskType === 'luecken'
                  ? generateLueckenTask(id, safeLevel, rng, tafelStart)
                  : generateZahlFindenTask(id, safeLevel, rng, tafelStart);

      const sig = `${candidate.type}:${candidate.promptText}:${JSON.stringify(candidate.expectedValue)}`;
      if (!seenSignatures.has(sig)) {
        seenSignatures.add(sig);
        task = candidate;
        break;
      }
    }
    if (task) tasks.push(task);
  }

  return tasks;
}

export function evaluateTaskField(
  field: TaskFieldSpec,
  userValue: number
): { correct: boolean; categories: ErrorCategoryCode[] } {
  if (userValue === field.expected) {
    return { correct: true, categories: [] };
  }
  return {
    correct: false,
    categories: matchAnswerToFaults(userValue, field.faults),
  };
}

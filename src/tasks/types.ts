import type { TaskFaultCandidate } from '../diagnostics/errorModel';

export type World1TaskType =
  | 'nachbar_4'
  | 'umgebung_8'
  | 'weg'
  | 'zeile_spalte'
  | 'luecken'
  | 'zahl_finden';

export type World2TaskType =
  | 'strich_zu_zahl'
  | 'zahl_zu_strich'
  | 'strich_zaehlen'
  | 'luecken_strahl'
  | 'zwischenzahl';

export type World3TaskType =
  | 'uebergang_plus'
  | 'uebergang_minus'
  | 'ergaenzen_zehner'
  | 'ergaenzen_100'
  | 'zerlegen';

export type World4TaskType =
  | 'plus_minus_einer'
  | 'plus_minus_zehner'
  | 'rechnen_uebergang'
  | 'tausch_umkehr'
  | 'verdoppeln_halbieren'
  | 'platzhalter';

export type World5TaskType = 'mauer_3_bis_20' | 'mauer_3_bis_100' | 'mauer_4';

export interface TaskFieldSpec {
  id: string;
  label: string;
  arrow?: 'up' | 'down' | 'left' | 'right' | 'diag';
  expected: number;
  row?: number;
  col?: number;
  markValue?: number;
  brickId?: string;
  allowHundreds?: boolean;
  faults: TaskFaultCandidate[];
}

export interface World1BoardContext {
  tafelStart: 1 | 0;
  startCell?: number;
  targetCell: number;
  hopPath: number[];
  givenCells: number[];
  cutoutRange?: { minRow: number; maxRow: number; minCol: number; maxCol: number };
  tapTarget?: number;
}

export interface NumberLineContext {
  min: number;
  max: number;
  step: number;
  majorStep: number;
  labeledMarks: number[];
  startMark?: number;
  targetMark: number;
  hopPath: number[];
  tapTarget?: number;
  hiddenMarks?: number[];
  betweenPair?: [number, number];
}

export interface CarryJumpContext {
  a: number;
  b: number;
  op: '+' | '-';
  target: number;
  intermediateTen: number;
  firstJump: number;
  secondJump: number;
  mode: 'calc' | 'complement_ten' | 'complement_100' | 'decompose';
}

export interface CalcWorkshopContext {
  a: number;
  b: number;
  op: '+' | '-';
  result: number;
  missingPos: 'result' | 'left' | 'right';
  strategyHint: string;
  helperEquation?: string;
}

export interface NumberWallBrick {
  id: string;
  row: number; // 0 = bottom, 1 = middle, ...
  col: number;
  value: number;
  isMissing: boolean;
}

export interface NumberWallContext {
  rows: NumberWallBrick[][]; // bottom row at index 0 -> top brick at last index
  targetTop: number;
}

export interface MathTask {
  id: string;
  world: number;
  level: number;
  difficulty: number; // 1..5
  skill: string;
  type: World1TaskType | World2TaskType | World3TaskType | World4TaskType | World5TaskType | string;
  promptText: string;
  spokenPrompt: string;
  helpText: string;
  inputMode: 'single_number' | 'multi_fields' | 'tap_board_then_number' | 'tap_mark';
  fields: TaskFieldSpec[];
  expectedValue: number | number[];
  boardContext?: World1BoardContext;
  numberLineContext?: NumberLineContext;
  carryContext?: CarryJumpContext;
  calcContext?: CalcWorkshopContext;
  wallContext?: NumberWallContext;
}

export type AnimalType = 'fuchs' | 'axolotl' | 'hase';

export type MascotMood = 'idle' | 'hop' | 'happy' | 'hm' | 'tired' | 'yawn' | 'nod';

export type SceneId =
  | 'welcome'
  | 'training'
  | 'map'
  | 'testbed'
  | 'level'
  | 'chest'
  | 'hub'
  | 'shop'
  | 'album'
  | 'practice'
  | 'parent';

export interface StrokePoint {
  x: number;
  y: number;
  t: number;
}

export type Stroke = StrokePoint[];

export interface DigitTemplate {
  id: string;
  digit: number;
  strokes: Stroke[];
  source: 'builtin' | 'training' | 'clarified' | 'testbed';
  createdAt: number;
}

export interface DigitCandidate {
  digit: number;
  probability: number;
  rawScore: number;
}

export type RecognitionStatus = 'clear' | 'clarify' | 'unreadable';

export interface RecognitionResult {
  status: RecognitionStatus;
  digit: number | null;
  candidates: DigitCandidate[];
  clarifyPair?: [number, number];
  mirrored: boolean;
  confidence: number;
  durationMs: number;
  strokesCount: number;
}

export type ErrorCategoryCode =
  | 'H1_oben_unten'
  | 'H2_links_rechts'
  | 'H3_zeile_spalte'
  | 'H4_plus1_vs_plus10'
  | 'H5_zeilenumbruch'
  | 'H6_startfeld_mitgezaehlt'
  | 'H7_zahlendreher'
  | 'Z1_startstrich_mitgezaehlt'
  | 'Z2_schrittweite_falsch'
  | 'Z3_richtung_falsch'
  | 'Z4_beschriftung_gelesen'
  | 'Z5_zahlendreher'
  | 'R1_uebergang_ausgelassen'
  | 'R2_zehner_statt_einer'
  | 'R3_rechenzeichen_vertauscht'
  | 'R4_rest_vergessen'
  | 'R5_kleine_minus_grosse'
  | 'R6_um_10_daneben'
  | 'R7_um_1_daneben'
  | 'M1_mauer_falschrum'
  | 'M2_nur_ein_nachbar'
  | 'M3_grundrechenfehler_20'
  | 'S1_gespiegelt'
  | 'S2_falsches_kaestchen'
  | 'S3_haeufige_rueckfrage'
  | 'X0_unklar';

export interface GameSettings {
  tafelStart: 1 | 0;
  strichZaehlung: 'start_zaehlt_nicht' | 'start_ist_erster';
  readAloud: boolean;
  effectsEnabled: boolean;
  musicEnabled: boolean;
  reducedMotion: boolean;
  leftHanded: boolean;
  pauseReminderMinutes: number;
  dailyHardLimitMinutes: number | null;
  parentPin: string | null;
  difficultyMode: 'auto' | 'fixed';
  enabledWorlds: number[];
  zehneruebergangEnabled: boolean;
}

export interface PlayerProfile {
  animal: AnimalType;
  animalName: string;
  trainingCompleted: boolean;
  coins: number;
  activeDays: string[];
  createdAt: number;
}

export interface TaskLogEntry {
  id: string;
  timestamp: number;
  world: number;
  level: number;
  skill: string;
  parameters: Record<string, unknown>;
  expected: number | number[];
  input: number | number[] | null;
  recognitionConfidence: number;
  clarified: boolean;
  errorCategories: ErrorCategoryCode[];
  helpLevel: number;
  durationToFirstStrokeMs: number;
  durationTotalMs: number;
  attempts: number;
  animalHelpUsed: boolean;
}

export interface SkillProgressEntry {
  mastery: number; // 0..1
  streak: number;
  errorStreak: number;
  nextReviewAt: number;
}

export interface HubPlacement {
  itemId: string;
  x: number;
  y: number;
  z?: number;
  rotation: number;
}

export interface AppStateV1 {
  schemaVersion: 1;
  profile: PlayerProfile | null;
  settings: GameSettings;
  worldProgress: Record<number, { unlockedLevel: number; starsByLevel: Record<number, number> }>;
  skillMastery: Record<string, number>;
  skillProgress: Record<string, SkillProgressEntry>;
  inventory: string[];
  unlockedStickers: string[];
  chestsOpened: number;
  dailyAdventureDate: string | null;
  playtimeByDate: Record<string, number>; // YYYY-MM-DD -> milliseconds
  wishlistItemId: string | null;
  equippedAccessories: {
    hat: string | null;
    cape: string | null;
    backpack: string | null;
    hopEffect: string | null;
  };
  hubPlacements: HubPlacement[];
  completedBuildQuests?: string[];
  activeSeriesId: string;
  unlockedPuzzlePieces: Record<string, number[]>;
  activePuzzleId: string;
}

export interface ExportBundle {
  exportedAt: number;
  schemaVersion: number;
  state: AppStateV1;
  learnedTemplates: DigitTemplate[];
  logs: TaskLogEntry[];
}

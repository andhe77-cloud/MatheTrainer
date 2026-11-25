import type { GameSettings } from '../core/types';

export interface RecognitionThresholds {
  tau_eindeutig: number;
  tau_rueckfrage: number;
  tau_lesbar: number;
  tau_abstand: number;
  tau_verwechslung: number;
  maxLearnedPerDigit: number;
}

export interface WorldConfig {
  id: number;
  slug: string;
  accentHex: string;
  surfaceHex: string;
  levelsCount: number;
}

export const APP_CONFIG = {
  version: '0.1.0',
  schemaVersion: 1 as const,
  gameplay: {
    tasksPerLevel: 8,
    bonusTaskThreshold: 6,
    maxHearts: 3,
    coinsFirstTry: 3,
    coinsAfterHelp1: 2,
    coinsAfterHelp2: 1,
    levelBonusCoins: 5,
    maxHopDurationMs: 3000,
    pauseReminderDefaultMinutes: 15,
  },
  recognition: {
    tau_eindeutig: 0.56,
    tau_rueckfrage: 0.28,
    tau_lesbar: 0.22,
    tau_abstand: 0.14,
    tau_verwechslung: 0.28,
    maxLearnedPerDigit: 20,
  } satisfies RecognitionThresholds,
  confusionGroups: [
    [1, 7],
    [4, 9],
    [0, 6],
    [5, 6],
    [2, 7],
    [3, 8],
  ] as Array<[number, number]>,
  defaultSettings: {
    tafelStart: 1,
    strichZaehlung: 'start_zaehlt_nicht',
    readAloud: true,
    effectsEnabled: true,
    musicEnabled: false,
    reducedMotion: false,
    leftHanded: false,
    pauseReminderMinutes: 15,
    dailyHardLimitMinutes: null,
    parentPin: null,
    difficultyMode: 'auto',
    enabledWorlds: [1, 2, 3, 4, 5],
    zehneruebergangEnabled: true,
  } satisfies GameSettings,
  worlds: [
    { id: 1, slug: 'bauplatte', accentHex: '#2563EB', surfaceHex: '#EFF6FF', levelsCount: 8 },
    { id: 2, slug: 'brueckental', accentHex: '#0D9488', surfaceHex: '#F0FDFA', levelsCount: 8 },
    { id: 3, slug: 'zehnerschlucht', accentHex: '#D97706', surfaceHex: '#FFFBEB', levelsCount: 8 },
    { id: 4, slug: 'rechenwerkstatt', accentHex: '#059669', surfaceHex: '#ECFDF5', levelsCount: 8 },
    { id: 5, slug: 'mauerburg', accentHex: '#7C3AED', surfaceHex: '#F5F3FF', levelsCount: 8 },
  ] satisfies WorldConfig[],
};

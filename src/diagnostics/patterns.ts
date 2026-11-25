import type { ErrorCategoryCode, TaskLogEntry } from '../core/types';
import { DIAGNOSTIC_HINTS } from './errorModel';

export interface ActiveErrorPattern {
  category: ErrorCategoryCode;
  countInRecent12: number;
  pctInRecent20: number;
  label: string;
  elternTipp: string;
  tierHinweis: string;
  exampleMismatch?: { expected: string; input: string };
}

export interface DiagnosticReport {
  activePatterns: ActiveErrorPattern[];
  strengths: Array<{ skill: string; label: string; accuracyPct: number; attempts: number }>;
  writingObservations: Array<{ category: ErrorCategoryCode; label: string; count: number; tip: string }>;
  dailyPlayStats: Array<{ date: string; minutes: number; tasksCount: number }>;
  worldAccuracy: Array<{ world: number; name: string; total: number; firstTryCorrect: number; accuracyPct: number }>;
  totalTasks7Days: number;
  totalMinutes7Days: number;
  weeklySummaryText: string;
  disclaimer: string;
}

const WORLD_NAMES: Record<number, string> = {
  1: 'Bauplatte (Hundertertafel)',
  2: 'Brückental (Zahlenstrahl)',
  3: 'Zehnerschlucht (Zehnerübergang)',
  4: 'Rechenwerkstatt (Plus & Minus)',
  5: 'Mauerburg (Zahlenmauern)',
};

const SKILL_LABELS: Record<string, string> = {
  'h100.nachbar_4': 'Nachbarzahlen auf der Hundertertafel',
  'h100.umgebung_8': '8er-Umgebung auf der Bauplatte',
  'h100.weg': 'Wege auf der Hundertertafel',
  'h100.zeile_spalte': 'Zeilen und Spalten finden',
  'h100.luecken': 'Lücken im Hunderterausschnitt',
  'h100.zahl_finden': 'Zahlen schnell finden',
  'z2.strich_zu_zahl': 'Zahlen am Zahlenstrahl ablesen',
  'z2.zahl_zu_strich': 'Zahlen am Zahlenstrahl zeigen',
  'z2.strich_zaehlen': 'Schritte am Zahlenstrahl zählen',
  'z2.luecken': 'Lücken am Zahlenstrahl füllen',
  'z2.zwischenzahl': 'Mitte zwischen zwei Zahlen',
  'z3.uebergang_plus': 'Plus über den Zehner',
  'z3.uebergang_minus': 'Minus über den Zehner',
  'z3.ergaenzen_zehner': 'Zum nächsten Zehner ergänzen',
  'z3.ergaenzen_100': 'Bis 100 ergänzen',
  'z3.zerlegen': 'Zahlen geschickt zerlegen',
  'r4.plus_minus_einer': 'Zehner und Einer rechnen',
  'r4.plus_minus_zehner': 'Mit vollen Zehnern rechnen',
  'r4.rechnen_uebergang': 'Rechnen mit Zehnerübergang',
  'r4.tausch_umkehr': 'Tausch- und Umkehraufgaben',
  'r4.verdoppeln_halbieren': 'Verdoppeln und Halbieren',
  'r4.platzhalter': 'Platzhalter-Aufgaben',
  'm5.mauer_3_20': 'Zahlenmauern bis 20',
  'm5.mauer_3_100': 'Zahlenmauern bis 100',
  'm5.mauer_4': 'Große 4er-Zahlenmauern',
};

const WRITING_CATEGORIES: ErrorCategoryCode[] = [
  'S1_gespiegelt',
  'S2_falsches_kaestchen',
  'S3_haeufige_rueckfrage',
];

/**
 * Pattern detection (Spec 8.2):
 * - Triggers when a non-writing math error category occurs >= 3 times in last 12 logs
 *   OR >= 25% of last 20 logs (minimum 2 occurrences to avoid 1/4 noise).
 * - Cleared automatically once the last 8 consecutive logs contain 0 occurrences of that category!
 */
export function detectActiveErrorPatterns(logs: TaskLogEntry[]): ActiveErrorPattern[] {
  const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length === 0) return [];

  const recent12 = sorted.slice(-12);
  const recent20 = sorted.slice(-20);
  const recent8 = sorted.slice(-8);

  const allCategories = new Set<ErrorCategoryCode>();
  for (const entry of recent20) {
    for (const c of entry.errorCategories) {
      if (!WRITING_CATEGORIES.includes(c) && c !== 'X0_unklar') {
        allCategories.add(c);
      }
    }
  }

  const patterns: ActiveErrorPattern[] = [];

  for (const cat of allCategories) {
    // End condition: 8 consecutive tasks without this fault -> cleared!
    const inRecent8 = recent8.some((l) => l.errorCategories.includes(cat));
    if (recent8.length >= 8 && !inRecent8) {
      continue;
    }

    const count12 = recent12.filter((l) => l.errorCategories.includes(cat)).length;
    const count20 = recent20.filter((l) => l.errorCategories.includes(cat)).length;
    const pct20 = Math.round((count20 / recent20.length) * 100);

    if (count12 >= 3 || (recent20.length >= 6 && count20 >= 2 && count20 / recent20.length >= 0.25)) {
      const hint = DIAGNOSTIC_HINTS[cat];
      const exampleLog = [...recent20].reverse().find((l) => l.errorCategories.includes(cat));
      patterns.push({
        category: cat,
        countInRecent12: count12,
        pctInRecent20: pct20,
        label: hint.title,
        elternTipp: hint.elternTipp,
        tierHinweis: hint.tierHinweis,
        exampleMismatch: exampleLog
          ? {
              expected: Array.isArray(exampleLog.expected)
                ? exampleLog.expected.join(', ')
                : String(exampleLog.expected),
              input:
                exampleLog.input === null
                  ? '—'
                  : Array.isArray(exampleLog.input)
                    ? exampleLog.input.join(', ')
                    : String(exampleLog.input),
            }
          : undefined,
      });
    }
  }

  return patterns.sort((a, b) => b.countInRecent12 - a.countInRecent12);
}

export function buildDiagnosticReport(
  logs: TaskLogEntry[],
  playtimeByDate: Record<string, number>
): DiagnosticReport {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const logs7Days = logs.filter((l) => l.timestamp >= sevenDaysAgo);

  const activePatterns = detectActiveErrorPatterns(logs);

  // Per-skill strengths (>= 3 attempts, >= 75% clean)
  const skillStats = new Map<string, { clean: number; total: number }>();
  for (const l of logs) {
    const curr = skillStats.get(l.skill) ?? { clean: 0, total: 0 };
    curr.total += 1;
    if (l.attempts === 1 && l.errorCategories.filter((c) => !WRITING_CATEGORIES.includes(c)).length === 0) {
      curr.clean += 1;
    }
    skillStats.set(l.skill, curr);
  }

  const strengths = Array.from(skillStats.entries())
    .filter(([, s]) => s.total >= 3 && s.clean / s.total >= 0.7)
    .map(([skill, s]) => ({
      skill,
      label: SKILL_LABELS[skill] ?? skill,
      accuracyPct: Math.round((s.clean / s.total) * 100),
      attempts: s.total,
    }))
    .sort((a, b) => b.accuracyPct - a.accuracyPct)
    .slice(0, 5);

  // World accuracy
  const worldAccuracy = [1, 2, 3, 4, 5].map((w) => {
    const wLogs = logs.filter((l) => l.world === w);
    const clean = wLogs.filter((l) => l.attempts === 1).length;
    return {
      world: w,
      name: WORLD_NAMES[w],
      total: wLogs.length,
      firstTryCorrect: clean,
      accuracyPct: wLogs.length > 0 ? Math.round((clean / wLogs.length) * 100) : 0,
    };
  });

  // Writing observations
  const writingObservations = WRITING_CATEGORIES.map((cat) => {
    const count = logs7Days.filter((l) => l.errorCategories.includes(cat)).length;
    const hint = DIAGNOSTIC_HINTS[cat];
    return {
      category: cat,
      label: hint.title,
      count,
      tip: hint.elternTipp,
    };
  }).filter((w) => w.count > 0);

  // Last 7 days daily stats
  const dailyPlayStats: DiagnosticReport['dailyPlayStats'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const ms = playtimeByDate[d] ?? 0;
    const tasksCount = logs.filter((l) => new Date(l.timestamp).toISOString().slice(0, 10) === d).length;
    dailyPlayStats.push({
      date: d,
      minutes: Math.round(ms / 60000),
      tasksCount,
    });
  }

  const totalMinutes7Days = dailyPlayStats.reduce((sum, d) => sum + d.minutes, 0);
  const totalTasks7Days = logs7Days.length;

  const strengthLine =
    strengths.length > 0
      ? `Stärken: ${strengths.map((s) => `${s.label} (${s.accuracyPct}%)`).join(', ')}.`
      : 'Stärken: Es werden noch Aufgaben gesammelt.';
  const patternLine =
    activePatterns.length > 0
      ? `Beobachtungen: ${activePatterns.map((p) => `${p.label} – ${p.elternTipp}`).join(' | ')}`
      : 'Beobachtungen: Keine auffälligen Fehlermuster in den letzten Aufgaben.';

  const weeklySummaryText = [
    'Klötzchen-Abenteuer · Wochenbericht',
    `Letzte 7 Tage: ${totalTasks7Days} gelöste Aufgaben · ca. ${totalMinutes7Days} Minuten Spielzeit.`,
    strengthLine,
    patternLine,
    'Hinweis: Das sind Lernbeobachtungen aus dem Spiel – keine medizinische Diagnose.',
  ].join('\n');

  return {
    activePatterns,
    strengths,
    writingObservations,
    dailyPlayStats,
    worldAccuracy,
    totalTasks7Days,
    totalMinutes7Days,
    weeklySummaryText,
    disclaimer: 'Hinweis: Das sind Lernbeobachtungen aus dem Spiel – keine medizinische Diagnose.',
  };
}

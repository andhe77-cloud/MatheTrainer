import { createRng } from '../core/rng';
import type { AppStateV1, ErrorCategoryCode, GameSettings, TaskLogEntry } from '../core/types';
import { detectActiveErrorPatterns } from '../diagnostics/patterns';
import type { MathTask } from './types';
import { evaluateTaskField, generateWorld1Level } from './world1Hundertertafel';
import { evaluateWorld2Field, generateWorld2Level } from './world2Zahlenstrahl';
import { evaluateWorld3Field, generateWorld3Level } from './world3Zehneruebergang';
import { evaluateWorld4Field, generateWorld4Level } from './world4Rechnen';
import { evaluateWorld5Field, generateWorld5Level } from './world5Zahlenmauer';

export function generateWorldTasks(
  worldId: number,
  level: number,
  seed: string | number,
  settings: GameSettings
): MathTask[] {
  if (worldId === 1) return generateWorld1Level(level, seed, settings.tafelStart);
  if (worldId === 2) return generateWorld2Level(level, seed, settings.strichZaehlung);
  if (worldId === 3) return generateWorld3Level(level, seed);
  if (worldId === 4) return generateWorld4Level(level, seed, settings.zehneruebergangEnabled);
  if (worldId === 5) return generateWorld5Level(level, seed);
  return generateWorld1Level(level, seed, settings.tafelStart);
}

export function evaluateFieldForWorld(
  worldId: number,
  field: MathTask['fields'][number],
  userValue: number
) {
  if (worldId === 2) return evaluateWorld2Field(field, userValue);
  if (worldId === 3) return evaluateWorld3Field(field, userValue);
  if (worldId === 4) return evaluateWorld4Field(field, userValue);
  if (worldId === 5) return evaluateWorld5Field(field, userValue);
  return evaluateTaskField(field, userValue);
}

function mapCategoryToWorld(cat: ErrorCategoryCode): number {
  if (cat.startsWith('H')) return 1;
  if (cat.startsWith('Z')) return 2;
  if (cat.startsWith('R')) return cat === 'R1_uebergang_ausgelassen' || cat === 'R4_rest_vergessen' ? 3 : 4;
  if (cat.startsWith('M')) return 5;
  return 1;
}

/**
 * Generates the Daily Adventure ("Tagesabenteuer", Spec 7.5):
 * 6 mixed tasks across enabled worlds:
 * ~60% current world/level (4 tasks), ~25% active error pattern (1 task), ~15% easy confidence booster (1 task).
 */
export function generateDailyAdventureTasks(
  state: AppStateV1,
  logs: TaskLogEntry[],
  dateStr: string
): MathTask[] {
  const rng = createRng(`daily_${dateStr}_${state.profile?.createdAt ?? 1}`);
  const enabled = state.settings.enabledWorlds.length > 0 ? state.settings.enabledWorlds : [1];
  const filteredEnabled = state.settings.zehneruebergangEnabled
    ? enabled
    : enabled.filter((w) => w !== 3);
  const worlds = filteredEnabled.length > 0 ? filteredEnabled : [1];

  const activePatterns = detectActiveErrorPatterns(logs);
  const chosenTasks: MathTask[] = [];

  // 1. Current worlds mix (~60% -> 4 tasks)
  for (let i = 0; i < 4; i++) {
    const w = worlds[i % worlds.length];
    const lvl = state.worldProgress[w]?.unlockedLevel ?? 1;
    const pool = generateWorldTasks(w, lvl, `${dateStr}_cur_${i}`, state.settings);
    if (pool.length > 0) {
      chosenTasks.push({ ...rng.pick(pool), id: `daily_cur_${i}` });
    }
  }

  // 2. Active pattern reinforcement (~20% -> 1-2 tasks)
  if (activePatterns.length > 0) {
    const patWorld = mapCategoryToWorld(activePatterns[0].category);
    const w = worlds.includes(patWorld) ? patWorld : worlds[0];
    const pool = generateWorldTasks(w, 2, `${dateStr}_pat`, state.settings);
    if (pool.length > 0) {
      chosenTasks.push({ ...rng.pick(pool), id: `daily_pat_1` });
    }
  } else {
    const w = rng.pick(worlds);
    const pool = generateWorldTasks(w, 2, `${dateStr}_mid`, state.settings);
    if (pool.length > 0) {
      chosenTasks.push({ ...rng.pick(pool), id: `daily_mid_1` });
    }
  }

  // 3. Easy confidence booster (~20% -> 1 task from level 1)
  const easyW = rng.pick(worlds);
  const easyPool = generateWorldTasks(easyW, 1, `${dateStr}_easy`, state.settings);
  if (easyPool.length > 0) {
    chosenTasks.push({ ...easyPool[0], id: `daily_easy_1` });
  }

  return chosenTasks;
}

/**
 * Generates 4 targeted practice tasks for the Practice Island ("Übungsinsel", Spec 8.2)
 * for a given error category.
 */
export function generatePracticeTasksForCategory(
  category: ErrorCategoryCode,
  settings: GameSettings,
  seed: string | number = Date.now()
): MathTask[] {
  const world = mapCategoryToWorld(category);
  const pool1 = generateWorldTasks(world, 2, `${seed}_p1`, settings);
  const pool2 = generateWorldTasks(world, 4, `${seed}_p2`, settings);
  const combined = [...pool1, ...pool2];

  // Prefer tasks whose fault model explicitly includes this category
  const matching = combined.filter((t) =>
    t.fields.some((f) => f.faults.some((flt) => flt.category === category))
  );

  const selected = matching.length >= 4 ? matching.slice(0, 4) : combined.slice(0, 4);
  return selected.map((t, i) => ({ ...t, id: `practice_${category}_${i}` }));
}

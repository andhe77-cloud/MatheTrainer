import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_STICKERS } from '../src/content/catalog';
import {
  createDefaultState,
  exportBackupBundle,
  importBackupBundle,
  loadAppState,
  loadLearnedTemplates,
  resetAllStorage,
  saveAppState,
  saveLearnedTemplate,
  appendTaskLog,
} from '../src/core/storage';
import type { ErrorCategoryCode, TaskLogEntry } from '../src/core/types';
import { buildDiagnosticReport, detectActiveErrorPatterns } from '../src/diagnostics/patterns';
import { applySkillUpdate } from '../src/rewards/adaptive';
import { openChestWithProtection } from '../src/rewards/chests';
import { applyCoinDelta, getChestTierForStars, purchaseCatalogItem } from '../src/rewards/economy';
import {
  evaluateFieldForWorld,
  generateDailyAdventureTasks,
  generatePracticeTasksForCategory,
  generateWorldTasks,
} from '../src/tasks/dailyAdventure';

function makeLog(idx: number, cats: ErrorCategoryCode[], world = 1, skill = 'h100.nachbar_4'): TaskLogEntry {
  return {
    id: `l_${idx}`,
    timestamp: Date.now() - (100 - idx) * 1000,
    world,
    level: 2,
    skill,
    parameters: {},
    expected: 25,
    input: cats.length > 0 ? 35 : 25,
    recognitionConfidence: 0.96,
    clarified: false,
    errorCategories: cats,
    helpLevel: cats.length > 0 ? 1 : 0,
    durationToFirstStrokeMs: 900,
    durationTotalMs: 3200,
    attempts: cats.length > 0 ? 2 : 1,
    animalHelpUsed: false,
  };
}

test('Pattern detector triggers on >=3/12 and clears cleanly after 8 fault-free logs', () => {
  const logs: TaskLogEntry[] = [
    makeLog(1, ['H1_oben_unten']),
    makeLog(2, []),
    makeLog(3, ['H1_oben_unten']),
    makeLog(4, ['H1_oben_unten']),
  ];

  const active = detectActiveErrorPatterns(logs);
  assert.equal(active.length, 1);
  assert.equal(active[0].category, 'H1_oben_unten');

  // Add 8 clean tasks without H1_oben_unten -> pattern clears!
  for (let i = 5; i <= 12; i++) {
    logs.push(makeLog(i, []));
  }
  const cleared = detectActiveErrorPatterns(logs);
  assert.equal(cleared.length, 0);
});

test('Diagnostic report builds world accuracy, strengths, weekly summary, and disclaimer', () => {
  const logs: TaskLogEntry[] = [];
  for (let i = 0; i < 6; i++) {
    logs.push(makeLog(i, [], 1));
  }
  logs.push(makeLog(7, ['R5_kleine_minus_grosse'], 3, 'z3.uebergang_minus'));
  logs.push(makeLog(8, ['R5_kleine_minus_grosse'], 3, 'z3.uebergang_minus'));
  logs.push(makeLog(9, ['R5_kleine_minus_grosse'], 3, 'z3.uebergang_minus'));

  const report = buildDiagnosticReport(logs, { [new Date().toISOString().slice(0, 10)]: 12 * 60000 });
  assert.equal(report.totalTasks7Days, 9);
  assert.ok(report.strengths.some((s) => s.skill === 'h100.nachbar_4' && s.accuracyPct === 100));
  assert.ok(report.activePatterns.some((p) => p.category === 'R5_kleine_minus_grosse'));
  assert.ok(report.disclaimer.includes('keine medizinische Diagnose'));
});

test('Daily Adventure and Practice Island generate targeted non-empty task lists', () => {
  const st = createDefaultState();
  st.profile = {
    animal: 'hase',
    animalName: 'Hoppel',
    trainingCompleted: true,
    coins: 20,
    activeDays: ['2026-01-01'],
    createdAt: 42,
  };
  const logs = [makeLog(1, ['M1_mauer_falschrum'], 5), makeLog(2, ['M1_mauer_falschrum'], 5), makeLog(3, ['M1_mauer_falschrum'], 5)];
  const daily = generateDailyAdventureTasks(st, logs, '2026-02-01');
  assert.equal(daily.length, 6);

  const practice = generatePracticeTasksForCategory('R5_kleine_minus_grosse', st.settings, 'p_seed');
  assert.equal(practice.length, 4);
});

test('Long-run stability simulation (240 rounds) maintains invariants and clean export/import roundtrip', async () => {
  await resetAllStorage();
  let st = createDefaultState();
  st.profile = {
    animal: 'fuchs',
    animalName: 'Fips',
    trainingCompleted: true,
    coins: 0,
    activeDays: ['2026-01-01'],
    createdAt: 777,
  };

  for (let round = 0; round < 240; round++) {
    const worldId = (round % 5) + 1;
    const level = (round % 8) + 1;
    const tasks = generateWorldTasks(worldId, level, `sim_${round}`, st.settings);
    assert.ok(tasks.length >= 6);

    for (const t of tasks) {
      for (const f of t.fields) {
        const ok = evaluateFieldForWorld(worldId, f, f.expected);
        assert.equal(ok.correct, true);
      }
      st = applySkillUpdate(st, t.skill, round % 4 !== 0, round * 1000);
    }

    st = {
      ...st,
      profile: {
        ...st.profile!,
        coins: applyCoinDelta(st.profile!.coins, 8),
      },
    };

    if (round % 6 === 0) {
      const { nextState } = openChestWithProtection(st, getChestTierForStars((round % 3) + 1), round);
      st = nextState;
    }

    if (round % 10 === 0) {
      const buy = purchaseCatalogItem(st, 'block_stone');
      if (buy.success) st = buy.state;
    }

    if (round % 12 === 0) {
      await saveLearnedTemplate({
        id: `sim_tpl_${round}`,
        digit: round % 10,
        strokes: [[{ x: 0.2, y: 0.2, t: 0 }, { x: 0.8, y: 0.8, t: 100 }]],
        source: 'clarified',
        createdAt: round,
      });
    }

    await appendTaskLog(makeLog(round, round % 9 === 0 ? ['H2_links_rechts'] : [], worldId));
  }

  await saveAppState(st);
  const templates = await loadLearnedTemplates();
  for (let d = 0; d <= 9; d++) {
    assert.ok(templates.filter((t) => t.digit === d).length <= 20, 'FIFO template cap exceeded');
  }
  assert.ok((st.profile?.coins ?? 0) >= 0);

  const bundle = await exportBackupBundle();
  const rawJson = JSON.stringify(bundle);
  await resetAllStorage();
  const restored = await importBackupBundle(JSON.parse(rawJson));
  const reloaded = await loadAppState();
  assert.equal(restored.chestsOpened, st.chestsOpened);
  assert.equal(reloaded.unlockedStickers.length, Math.min(40, ALL_STICKERS.length));
  assert.equal(new Set(reloaded.unlockedStickers).size, reloaded.unlockedStickers.length);
});

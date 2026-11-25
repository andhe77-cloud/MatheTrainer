import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorld2Field, generateWorld2Level } from '../src/tasks/world2Zahlenstrahl';
import type { ErrorCategoryCode } from '../src/core/types';

test('World 2 generates all 8 levels with all 5 task types and valid ranges', () => {
  const seenTypes = new Set<string>();
  for (let lvl = 1; lvl <= 8; lvl++) {
    const tasks = generateWorld2Level(lvl, `seed_${lvl}`, 'start_zaehlt_nicht');
    assert.equal(tasks.length, 8, `Level ${lvl} should have 8 tasks`);
    for (const t of tasks) {
      seenTypes.add(t.type);
      assert.equal(t.world, 2);
      assert.ok(t.numberLineContext, 'Task must carry numberLineContext');
      for (const f of t.fields) {
        assert.ok(f.expected >= 0 && f.expected <= 100);
        const ok = evaluateWorld2Field(f, f.expected);
        assert.equal(ok.correct, true);
      }
    }
  }
  assert.deepEqual(
    Array.from(seenTypes).sort(),
    ['luecken_strahl', 'strich_zaehlen', 'strich_zu_zahl', 'zahl_zu_strich', 'zwischenzahl']
  );
});

test('World 2 O1 strichZaehlung setting changes expected target cleanly', () => {
  const t1 = generateWorld2Level(1, 'o1_test', 'start_zaehlt_nicht').find((t) => t.type === 'strich_zaehlen')!;
  const t2 = generateWorld2Level(1, 'o1_test', 'start_ist_erster').find((t) => t.type === 'strich_zaehlen')!;
  assert.ok(t1 && t2);
  assert.notEqual(t1.expectedValue, t2.expectedValue);
  assert.ok(t1.promptText.includes('Hüpfe'));
  assert.ok(t2.promptText.includes('erster Strich'));
});

test('World 2 fault model detects Z1..Z5 categories accurately', () => {
  const allTasks = [1, 2, 3, 4, 5, 6].flatMap((lvl) =>
    generateWorld2Level(lvl, `faults_${lvl}`, 'start_zaehlt_nicht')
  );
  const categories = new Set<ErrorCategoryCode>();

  for (const t of allTasks) {
    for (const f of t.fields) {
      for (const fault of f.faults) {
        if (typeof fault.answer === 'number' && fault.answer !== f.expected) {
          const res = evaluateWorld2Field(f, fault.answer);
          assert.equal(res.correct, false);
          for (const c of res.categories) categories.add(c);
        }
      }
    }
  }

  for (const expectedCat of [
    'Z1_startstrich_mitgezaehlt',
    'Z2_schrittweite_falsch',
    'Z3_richtung_falsch',
    'Z4_beschriftung_gelesen',
    'Z5_zahlendreher',
  ] as ErrorCategoryCode[]) {
    assert.ok(categories.has(expectedCat), `Expected World 2 fault ${expectedCat}`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorld3Field, generateWorld3Level } from '../src/tasks/world3Zehneruebergang';
import { evaluateWorld4Field, generateWorld4Level } from '../src/tasks/world4Rechnen';
import { evaluateWorld5Field, generateWorld5Level } from '../src/tasks/world5Zahlenmauer';
import type { ErrorCategoryCode } from '../src/core/types';

test('World 3 generates all 8 levels, 5 types, and detects R1..R7 faults', () => {
  const types = new Set<string>();
  const cats = new Set<ErrorCategoryCode>();

  for (let lvl = 1; lvl <= 8; lvl++) {
    const tasks = generateWorld3Level(lvl, `w3_${lvl}`);
    assert.equal(tasks.length, 8);
    for (const t of tasks) {
      types.add(t.type);
      for (const f of t.fields) {
        assert.equal(evaluateWorld3Field(f, f.expected).correct, true);
        for (const flt of f.faults) {
          if (typeof flt.answer === 'number' && flt.answer !== f.expected) {
            const res = evaluateWorld3Field(f, flt.answer);
            assert.equal(res.correct, false);
            for (const c of res.categories) cats.add(c);
          }
        }
      }
    }
  }

  assert.equal(types.size, 5);
  for (const req of [
    'R1_uebergang_ausgelassen',
    'R2_zehner_statt_einer',
    'R3_rechenzeichen_vertauscht',
    'R4_rest_vergessen',
    'R5_kleine_minus_grosse',
    'R6_um_10_daneben',
    'R7_um_1_daneben',
  ] as ErrorCategoryCode[]) {
    assert.ok(cats.has(req), `World 3 missing fault ${req}`);
  }
});

test('World 4 respects zehneruebergangEnabled flag and generates valid arithmetic tasks', () => {
  const withoutCarry = generateWorld4Level(6, 'w4_no_carry', false);
  assert.equal(withoutCarry.length, 8);
  assert.equal(withoutCarry.some((t) => t.type === 'rechnen_uebergang'), false);

  const types = new Set<string>();
  for (let lvl = 1; lvl <= 8; lvl++) {
    const tasks = generateWorld4Level(lvl, `w4_${lvl}`, true);
    assert.equal(tasks.length, 8);
    for (const t of tasks) {
      types.add(t.type);
      for (const f of t.fields) {
        assert.ok(f.expected >= 0 && f.expected <= 100);
        assert.equal(evaluateWorld4Field(f, f.expected).correct, true);
      }
    }
  }
  assert.equal(types.size, 6);
});

test('World 5 follows O3 progression and verifies wall brick addition & M1..M3 faults', () => {
  const cats = new Set<ErrorCategoryCode>();

  for (let lvl = 1; lvl <= 8; lvl++) {
    const tasks = generateWorld5Level(lvl, `w5_${lvl}`);
    assert.equal(tasks.length, 6);
    for (const t of tasks) {
      const ctx = t.wallContext!;
      assert.ok(ctx);
      if (lvl <= 2) {
        assert.equal(ctx.rows.length, 3);
        assert.ok(ctx.targetTop <= 20);
      } else if (lvl <= 5) {
        assert.equal(ctx.rows.length, 3);
        assert.ok(ctx.targetTop <= 100);
      } else {
        assert.equal(ctx.rows.length, 4);
        assert.ok(ctx.targetTop <= 100);
      }

      // Verify brick sum invariants bottom-to-top
      for (let r = 1; r < ctx.rows.length; r++) {
        for (let c = 0; c < ctx.rows[r].length; c++) {
          assert.equal(
            ctx.rows[r][c].value,
            ctx.rows[r - 1][c].value + ctx.rows[r - 1][c + 1].value
          );
        }
      }

      for (const f of t.fields) {
        assert.equal(evaluateWorld5Field(f, f.expected).correct, true);
        for (const flt of f.faults) {
          if (typeof flt.answer === 'number' && flt.answer !== f.expected) {
            const res = evaluateWorld5Field(f, flt.answer);
            for (const c of res.categories) cats.add(c);
          }
        }
      }
    }
  }

  for (const req of ['M1_mauer_falschrum', 'M2_nur_ein_nachbar', 'M3_grundrechenfehler_20'] as ErrorCategoryCode[]) {
    assert.ok(cats.has(req), `World 5 missing fault ${req}`);
  }
});

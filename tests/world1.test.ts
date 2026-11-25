import assert from 'node:assert/strict';
import test from 'node:test';
import type { ErrorCategoryCode } from '../src/core/types';
import {
  buildBoardHopPath,
  coordsToNumber,
  evaluateTaskField,
  generateWorld1Level,
  getBoardCoords,
} from '../src/tasks/world1Hundertertafel';

test('board coordinates map row 1 top, col 1 left for both tafelStart=1 and tafelStart=0', () => {
  assert.deepEqual(getBoardCoords(1, 1), { row: 1, col: 1 });
  assert.deepEqual(getBoardCoords(10, 1), { row: 1, col: 10 });
  assert.deepEqual(getBoardCoords(11, 1), { row: 2, col: 1 });
  assert.deepEqual(getBoardCoords(84, 1), { row: 9, col: 4 });
  assert.equal(coordsToNumber(3, 7, 1), 27);

  assert.deepEqual(getBoardCoords(0, 0), { row: 1, col: 1 });
  assert.deepEqual(getBoardCoords(99, 0), { row: 10, col: 10 });
  assert.equal(coordsToNumber(3, 7, 0), 26);

  assert.deepEqual(buildBoardHopPath(36, 20, 1), [36, 26, 16, 17, 18, 19, 20]);
});

test('all 8 levels of World 1 are deterministic, unique, and in valid range', () => {
  const seenTypes = new Set<string>();
  for (let lvl = 1; lvl <= 8; lvl++) {
    const a = generateWorld1Level(lvl, 'fixed-seed', 1);
    const b = generateWorld1Level(lvl, 'fixed-seed', 1);
    assert.deepEqual(a, b, `Level ${lvl} must be deterministic`);
    assert.equal(a.length, 8, `Level ${lvl} must have 8 tasks`);

    const sigs = new Set<string>();
    for (const t of a) {
      seenTypes.add(t.type);
      const sig = `${t.type}:${t.promptText}`;
      assert.equal(sigs.has(sig), false, `Duplicate task in level ${lvl}: ${sig}`);
      for (const f of t.fields) {
        assert.ok(f.expected >= 1 && f.expected <= 100, `Expected ${f.expected} out of range 1..100`);
      }
    }
  }

  for (const expectedType of ['nachbar_4', 'umgebung_8', 'weg', 'zeile_spalte', 'luecken', 'zahl_finden']) {
    assert.ok(seenTypes.has(expectedType), `Missing task type ${expectedType}`);
  }
});

test('error model categories H1-H7 are produced and detected by evaluateTaskField', () => {
  const covered = new Set<ErrorCategoryCode>();

  for (let lvl = 1; lvl <= 8; lvl++) {
    for (const seed of ['s1', 's2', 's3']) {
      const tasks = generateWorld1Level(lvl, seed, 1);
      for (const task of tasks) {
        for (const field of task.fields) {
          // Verify correct answer returns correct=true
          const ok = evaluateTaskField(field, field.expected);
          assert.equal(ok.correct, true);
          assert.equal(ok.categories.length, 0);

          // Verify every fault answer triggers its predicted category
          for (const fault of field.faults) {
            if (typeof fault.answer === 'number' && fault.answer !== field.expected) {
              const res = evaluateTaskField(field, fault.answer);
              assert.equal(res.correct, false);
              assert.ok(
                res.categories.includes(fault.category),
                `Fault answer ${fault.answer} for ${task.type} did not match ${fault.category}`
              );
              covered.add(fault.category);
            }
          }
        }
      }
    }
  }

  const requiredH: ErrorCategoryCode[] = [
    'H1_oben_unten',
    'H2_links_rechts',
    'H3_zeile_spalte',
    'H4_plus1_vs_plus10',
    'H5_zeilenumbruch',
    'H6_startfeld_mitgezaehlt',
    'H7_zahlendreher',
  ];
  for (const cat of requiredH) {
    assert.ok(covered.has(cat), `Error category ${cat} was never exercised across levels 1..8`);
  }
});

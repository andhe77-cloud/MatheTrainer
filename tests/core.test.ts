import assert from 'node:assert/strict';
import test from 'node:test';
import { createRng } from '../src/core/rng';
import { numberToGermanWords, splitTensOnes } from '../src/core/speech';
import {
  exportBackupBundle,
  importBackupBundle,
  loadAppState,
  loadLearnedTemplates,
  migrateState,
  resetAllStorage,
  saveAppState,
  saveLearnedTemplate,
} from '../src/core/storage';

test('seeded RNG is deterministic', () => {
  const a = createRng('seed-42');
  const b = createRng('seed-42');
  const seqA = Array.from({ length: 10 }, () => a.int(1, 100));
  const seqB = Array.from({ length: 10 }, () => b.int(1, 100));
  assert.deepEqual(seqA, seqB);
});

test('German number word generator produces correct Bavarian/German words', () => {
  assert.equal(numberToGermanWords(0), 'null');
  assert.equal(numberToGermanWords(1), 'eins');
  assert.equal(numberToGermanWords(11), 'elf');
  assert.equal(numberToGermanWords(17), 'siebzehn');
  assert.equal(numberToGermanWords(20), 'zwanzig');
  assert.equal(numberToGermanWords(21), 'einundzwanzig');
  assert.equal(numberToGermanWords(47), 'siebenundvierzig');
  assert.equal(numberToGermanWords(84), 'vierundachtzig');
  assert.equal(numberToGermanWords(100), 'einhundert');
  assert.deepEqual(splitTensOnes(84), { hundreds: 0, tensValue: 80, onesValue: 4 });
});

test('storage migration, FIFO template cap (20/digit), and backup export/import', async () => {
  await resetAllStorage();
  const migrated = migrateState({ profile: { animal: 'hase', animalName: 'Hoppel' } });
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.settings.tafelStart, 1);
  assert.equal(migrated.settings.strichZaehlung, 'start_zaehlt_nicht');

  await saveAppState(migrated);
  const loaded = await loadAppState();
  assert.equal(loaded.profile?.animalName, 'Hoppel');

  // Insert 23 templates for digit 7 -> must keep newest 20
  for (let i = 0; i < 23; i++) {
    await saveLearnedTemplate({
      id: `tpl_7_${i}`,
      digit: 7,
      strokes: [[{ x: 10, y: 10, t: i }, { x: 50, y: 10, t: i + 1 }, { x: 20, y: 80, t: i + 2 }]],
      source: 'training',
      createdAt: 1000 + i,
    });
  }
  const templates = await loadLearnedTemplates();
  const sevens = templates.filter((t) => t.digit === 7);
  assert.equal(sevens.length, 20);
  assert.equal(sevens.some((t) => t.id === 'tpl_7_0'), false);
  assert.equal(sevens.some((t) => t.id === 'tpl_7_22'), true);

  const bundle = await exportBackupBundle();
  await resetAllStorage();
  const afterReset = await loadLearnedTemplates();
  assert.equal(afterReset.length, 0);

  await importBackupBundle(bundle);
  const restoredTemplates = await loadLearnedTemplates();
  assert.equal(restoredTemplates.length, 20);
});

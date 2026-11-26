import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ALBUM_SERIES, ALL_STICKERS, CATALOG_ITEMS, MINIGAMES, PUZZLE_PICTURES } from '../src/content/catalog';
import { createDefaultState } from '../src/core/storage';
import { applySkillUpdate, getSuggestedDifficultyTier, updateSkillProgressEntry } from '../src/rewards/adaptive';
import { openChestWithProtection } from '../src/rewards/chests';
import {
  applyCoinDelta,
  calculateFleissbaumProgress,
  isDailyAdventureCompletedToday,
  purchaseCatalogItem,
} from '../src/rewards/economy';

test('Catalog meets >=40 items, 14 GIF series (353 stickers), 15 puzzles, and 4 minigames', () => {
  assert.ok(CATALOG_ITEMS.length >= 40, `Expected >=40 items, got ${CATALOG_ITEMS.length}`);
  assert.equal(ALBUM_SERIES.length, 14);
  assert.equal(ALL_STICKERS.length, 353);
  assert.equal(new Set(ALL_STICKERS.map((s) => s.id)).size, 353);
  assert.equal(PUZZLE_PICTURES.length, 15);
  assert.equal(new Set(PUZZLE_PICTURES.map((p) => p.id)).size, 15);
  assert.equal(MINIGAMES.length, 4);

  for (const mg of MINIGAMES) {
    const item = CATALOG_ITEMS.find((it) => it.id === mg.catalogItemId);
    assert.ok(item, `Missing catalog item for minigame ${mg.id}`);
    assert.equal(item.category, 'minigame');
    assert.equal(item.price, mg.price);
    const htmlPath = path.resolve(process.cwd(), 'public', 'minigames', mg.fileName);
    assert.ok(fs.existsSync(htmlPath), `Missing HTML file ${htmlPath}`);
  }
  assert.equal(CATALOG_ITEMS.find((i) => i.id === 'game_brot_alarm')?.price, 100);
  assert.equal(CATALOG_ITEMS.find((i) => i.id === 'game_koi_teich')?.price, 150);
  assert.equal(CATALOG_ITEMS.find((i) => i.id === 'game_sternen_schleuder')?.price, 150);
  assert.equal(CATALOG_ITEMS.find((i) => i.id === 'game_kloetzchen_flitzer')?.price, 150);
  assert.equal(CATALOG_ITEMS.find((i) => i.id === 'game_broti_abenteuer'), undefined);

  assert.equal(isDailyAdventureCompletedToday(null, '2026-11-26'), false);
  assert.equal(isDailyAdventureCompletedToday('2026-11-25', '2026-11-26'), false);
  assert.equal(isDailyAdventureCompletedToday('2026-11-26', '2026-11-26'), true);
});

test('Coin balance is never negative and shop purchase prevents duplicates', () => {
  assert.equal(applyCoinDelta(5, -20), 0);

  let st = createDefaultState();
  st.profile = {
    animal: 'fuchs',
    animalName: 'Fips',
    trainingCompleted: true,
    coins: 40,
    activeDays: ['2026-01-01'],
    createdAt: 1,
  };

  const failTooExpensive = purchaseCatalogItem(st, 'build_castle');
  assert.equal(failTooExpensive.success, false);
  assert.equal(failTooExpensive.reason, 'insufficient_coins');

  const buyOk = purchaseCatalogItem(st, 'hat_cap');
  assert.equal(buyOk.success, true);
  assert.equal(buyOk.state.profile?.coins, 5);
  assert.equal(buyOk.state.equippedAccessories.hat, 'hat_cap');

  const failDup = purchaseCatalogItem(buyOk.state, 'hat_cap');
  assert.equal(failDup.success, false);
  assert.equal(failDup.reason, 'already_owned');

  // Minigame purchase flow
  let mgState = createDefaultState();
  mgState.profile = {
    animal: 'axolotl',
    animalName: 'Lotti',
    trainingCompleted: true,
    coins: 250,
    activeDays: ['2026-01-01'],
    createdAt: 1,
  };
  const buyBrot = purchaseCatalogItem(mgState, 'game_brot_alarm');
  assert.equal(buyBrot.success, true);
  assert.equal(buyBrot.state.profile?.coins, 150);
  assert.ok(buyBrot.state.inventory.includes('game_brot_alarm'));

  const buyKoi = purchaseCatalogItem(buyBrot.state, 'game_koi_teich');
  assert.equal(buyKoi.success, true);
  assert.equal(buyKoi.state.profile?.coins, 0);
  assert.ok(buyKoi.state.inventory.includes('game_koi_teich'));

  const failStars = purchaseCatalogItem(buyKoi.state, 'game_sternen_schleuder');
  assert.equal(failStars.success, false);
  assert.equal(failStars.reason, 'insufficient_coins');
});

test('Chest duplicate protection grants unique stickers and puzzle pieces and never drops minigames', () => {
  let st = createDefaultState();
  st.profile = {
    animal: 'axolotl',
    animalName: 'Lotti',
    trainingCompleted: true,
    coins: 0,
    activeDays: ['2026-01-01'],
    createdAt: 1,
  };

  const seenStickers = new Set<string>();
  const seenPuzzleTiles = new Set<string>();
  const totalStickers = ALL_STICKERS.length;
  const totalPuzzlePieces = PUZZLE_PICTURES.reduce((sum, p) => sum + p.piecesCount, 0);

  for (let i = 0; i < totalStickers; i++) {
    const res = openChestWithProtection(st, 'iron', i);
    st = res.nextState;
    assert.ok(res.outcome.sticker, `Chest ${i + 1} should award an unowned sticker`);
    assert.equal(seenStickers.has(res.outcome.sticker!.id), false, 'Duplicate sticker awarded!');
    seenStickers.add(res.outcome.sticker!.id);
    if (res.outcome.item) {
      assert.notEqual(res.outcome.item.category, 'minigame');
    }

    if (i < totalPuzzlePieces) {
      assert.ok(res.outcome.puzzleDrop, `Chest ${i + 1} should uncover a puzzle piece`);
      const tileKey = `${res.outcome.puzzleDrop!.puzzle.id}_${res.outcome.puzzleDrop!.pieceIndex}`;
      assert.equal(seenPuzzleTiles.has(tileKey), false, 'Duplicate puzzle tile awarded!');
      seenPuzzleTiles.add(tileKey);
    } else {
      assert.equal(res.outcome.puzzleDrop, null);
    }
  }

  assert.equal(st.unlockedStickers.length, totalStickers);
  assert.equal(seenPuzzleTiles.size, totalPuzzlePieces);

  // After all stickers and 90 puzzle pieces are collected
  const extra = openChestWithProtection(st, 'wood', 999);
  assert.equal(extra.outcome.sticker, null);
  assert.equal(extra.outcome.puzzleDrop, null);
  assert.ok(extra.outcome.coinsBonus >= 19);
});

test('Adaptive mastery raises after 3 clean solves and lowers after 2 errors', () => {
  let entry = updateSkillProgressEntry(undefined, true, 1000);
  entry = updateSkillProgressEntry(entry, true, 2000);
  assert.equal(entry.mastery, 0.2);
  entry = updateSkillProgressEntry(entry, true, 3000);
  assert.ok(entry.mastery > 0.2);

  entry = updateSkillProgressEntry(entry, false, 4000);
  const beforeSecondErr = entry.mastery;
  entry = updateSkillProgressEntry(entry, false, 5000);
  assert.ok(entry.mastery < beforeSecondErr);

  let appSt = createDefaultState();
  for (let i = 0; i < 9; i++) {
    appSt = applySkillUpdate(appSt, 'r4.rechnen_uebergang', true, i * 1000);
  }
  assert.ok(getSuggestedDifficultyTier(appSt, 'r4.rechnen_uebergang') >= 4);
});

test('Fleissbaum counts unique active days without streak penalties', () => {
  const res = calculateFleissbaumProgress(['2026-01-01', '2026-01-01', '2026-01-05', '2026-01-12']);
  assert.equal(res.daysCount, 3);
  assert.equal(res.blossoms, 1);
});

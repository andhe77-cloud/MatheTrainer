import {
  ALL_STICKERS,
  ALBUM_SERIES,
  CATALOG_ITEMS,
  PUZZLE_PICTURES,
  type AlbumSticker,
  type CatalogItem,
  type PuzzlePicture,
} from '../content/catalog';
import { createRng, type SeededRng } from '../core/rng';
import type { AppStateV1 } from '../core/types';
import { applyCoinDelta, type ChestTier } from './economy';

export interface PuzzleDropInfo {
  puzzle: PuzzlePicture;
  pieceIndex: number; // 0..5
  unlockedCount: number;
  totalCount: number;
  completedNow: boolean;
}

export interface ChestRewardOutcome {
  tier: ChestTier;
  coinsBonus: number;
  sticker: AlbumSticker | null;
  item: CatalogItem | null;
  puzzleDrop: PuzzleDropInfo | null;
  seriesCompletedTitle: string | null;
  allCollectedBonus: boolean;
}

const CHEST_COINS: Record<ChestTier, [number, number]> = {
  wood: [4, 7],
  iron: [7, 11],
  gold: [12, 18],
};

/**
 * Opens a reward chest with strict Duplicate Protection (Spec 7.1):
 * - Never grants a sticker, puzzle piece, or item already owned until the pool is exhausted.
 * - Prefers unowned stickers from the active series first, then other series.
 * - Uncovers 1 new tile (0..5) of the active or next incomplete Puzzle Picture.
 * - Gold/iron chests also have a chance to drop an unowned affordable hub/deco item.
 */
export function openChestWithProtection(
  state: AppStateV1,
  tier: ChestTier,
  seed: string | number = Date.now()
): { outcome: ChestRewardOutcome; nextState: AppStateV1 } {
  const rng: SeededRng = createRng(`chest_${tier}_${state.chestsOpened}_${seed}`);
  const [minC, maxC] = CHEST_COINS[tier];
  const baseCoins = rng.int(minC, maxC);

  const ownedStickers = new Set(state.unlockedStickers);
  const ownedItems = new Set(state.inventory);

  // Active series first
  const activeSeries = ALBUM_SERIES.find((s) => s.id === state.activeSeriesId) ?? ALBUM_SERIES[0];
  const unownedInActive = activeSeries.stickers.filter((st) => !ownedStickers.has(st.id));
  const unownedAnywhere = ALL_STICKERS.filter((st) => !ownedStickers.has(st.id));

  let awardedSticker: AlbumSticker | null = null;
  if (unownedInActive.length > 0) {
    awardedSticker = rng.pick(unownedInActive);
  } else if (unownedAnywhere.length > 0) {
    awardedSticker = rng.pick(unownedAnywhere);
  }

  // Puzzle piece drop (with strict duplicate protection across 15 x 6 = 90 tiles)
  const prevPuzzleMap = state.unlockedPuzzlePieces ?? {};
  const nextPuzzleMap: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(prevPuzzleMap)) {
    nextPuzzleMap[k] = [...v];
  }

  const getMissingIndices = (pz: PuzzlePicture): number[] => {
    const owned = new Set(nextPuzzleMap[pz.id] ?? []);
    const missing: number[] = [];
    for (let idx = 0; idx < pz.piecesCount; idx++) {
      if (!owned.has(idx)) missing.push(idx);
    }
    return missing;
  };

  const preferredPuzzle =
    PUZZLE_PICTURES.find((p) => p.id === state.activePuzzleId) ?? PUZZLE_PICTURES[0];
  let targetPuzzle: PuzzlePicture | undefined =
    getMissingIndices(preferredPuzzle).length > 0
      ? preferredPuzzle
      : PUZZLE_PICTURES.find((p) => getMissingIndices(p).length > 0);

  let puzzleDrop: PuzzleDropInfo | null = null;
  let nextActivePuzzleId = state.activePuzzleId || PUZZLE_PICTURES[0].id;

  if (targetPuzzle) {
    const missing = getMissingIndices(targetPuzzle);
    const chosenPiece = rng.pick(missing);
    const updatedPieces = [...(nextPuzzleMap[targetPuzzle.id] ?? []), chosenPiece].sort((a, b) => a - b);
    nextPuzzleMap[targetPuzzle.id] = updatedPieces;

    const completedNow = updatedPieces.length >= targetPuzzle.piecesCount;
    puzzleDrop = {
      puzzle: targetPuzzle,
      pieceIndex: chosenPiece,
      unlockedCount: updatedPieces.length,
      totalCount: targetPuzzle.piecesCount,
      completedNow,
    };

    if (completedNow) {
      const nextIncomplete = PUZZLE_PICTURES.find(
        (p) => (nextPuzzleMap[p.id]?.length ?? 0) < p.piecesCount
      );
      nextActivePuzzleId = nextIncomplete ? nextIncomplete.id : targetPuzzle.id;
    } else {
      nextActivePuzzleId = targetPuzzle.id;
    }
  }

  // Optional item drop for iron/gold chests if affordable items remain unowned
  let awardedItem: CatalogItem | null = null;
  const maxDropPrice = tier === 'gold' ? 75 : tier === 'iron' ? 35 : 0;
  if (maxDropPrice > 0) {
    const unownedItems = CATALOG_ITEMS.filter(
      (it) => !ownedItems.has(it.id) && it.price <= maxDropPrice
    );
    if (unownedItems.length > 0 && (awardedSticker === null || tier === 'gold')) {
      awardedItem = rng.pick(unownedItems);
    }
  }

  const allCollectedBonus = awardedSticker === null && awardedItem === null && puzzleDrop === null;
  const coinsBonus = allCollectedBonus ? baseCoins + 15 : baseCoins;

  const nextStickers = awardedSticker
    ? [...state.unlockedStickers, awardedSticker.id]
    : [...state.unlockedStickers];
  const nextInventory = awardedItem
    ? [...state.inventory, awardedItem.id]
    : [...state.inventory];

  // Check if awarding this sticker just completed its series
  let seriesCompletedTitle: string | null = null;
  if (awardedSticker) {
    const series = ALBUM_SERIES.find((s) => s.id === awardedSticker!.seriesId);
    if (series && series.stickers.every((st) => nextStickers.includes(st.id))) {
      seriesCompletedTitle = series.title;
    }
  }

  const currentCoins = state.profile?.coins ?? 0;
  const nextCoins = applyCoinDelta(currentCoins, coinsBonus);

  const nextState: AppStateV1 = {
    ...state,
    profile: state.profile ? { ...state.profile, coins: nextCoins } : null,
    unlockedStickers: nextStickers,
    inventory: nextInventory,
    unlockedPuzzlePieces: nextPuzzleMap,
    activePuzzleId: nextActivePuzzleId,
    chestsOpened: state.chestsOpened + 1,
  };

  return {
    outcome: {
      tier,
      coinsBonus,
      sticker: awardedSticker,
      item: awardedItem,
      puzzleDrop,
      seriesCompletedTitle,
      allCollectedBonus,
    },
    nextState,
  };
}

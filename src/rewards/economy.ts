import { findCatalogItem } from '../content/catalog';
import type { AppStateV1 } from '../core/types';

export type ChestTier = 'wood' | 'iron' | 'gold';

export function getChestTierForStars(stars: number): ChestTier {
  if (stars >= 3) return 'gold';
  if (stars === 2) return 'iron';
  return 'wood';
}

export function applyCoinDelta(currentCoins: number, delta: number): number {
  const safeCurrent = Math.max(0, Math.floor(currentCoins));
  const next = safeCurrent + Math.floor(delta);
  return Math.max(0, next);
}

export function canAfford(coins: number, price: number): boolean {
  return coins >= price && price >= 0;
}

export function purchaseCatalogItem(
  state: AppStateV1,
  itemId: string
): { success: boolean; state: AppStateV1; reason?: 'not_found' | 'already_owned' | 'insufficient_coins' } {
  const item = findCatalogItem(itemId);
  if (!item) return { success: false, state, reason: 'not_found' };
  if (state.inventory.includes(itemId)) return { success: false, state, reason: 'already_owned' };
  const currentCoins = state.profile?.coins ?? 0;
  if (!canAfford(currentCoins, item.price)) {
    return { success: false, state, reason: 'insufficient_coins' };
  }

  const nextCoins = applyCoinDelta(currentCoins, -item.price);
  const nextInventory = [...state.inventory, itemId];
  const nextWishlist = state.wishlistItemId === itemId ? null : state.wishlistItemId;

  // Auto-equip if it's a wearable accessory or hop effect and slot is currently empty
  const nextEquipped = { ...state.equippedAccessories };
  if (item.category === 'hat' && !nextEquipped.hat) nextEquipped.hat = itemId;
  if (item.category === 'cape' && !nextEquipped.cape) nextEquipped.cape = itemId;
  if (item.category === 'backpack' && !nextEquipped.backpack) nextEquipped.backpack = itemId;
  if (item.category === 'hopEffect' && !nextEquipped.hopEffect) nextEquipped.hopEffect = itemId;

  return {
    success: true,
    state: {
      ...state,
      profile: state.profile ? { ...state.profile, coins: nextCoins } : null,
      inventory: nextInventory,
      wishlistItemId: nextWishlist,
      equippedAccessories: nextEquipped,
    },
  };
}

export function calculateFleissbaumProgress(activeDays: string[]): {
  daysCount: number;
  leaves: number;
  blossoms: number;
  stageLabel: string;
} {
  const uniqueDays = new Set(activeDays);
  const daysCount = uniqueDays.size;
  const leaves = Math.min(20, daysCount * 2);
  const blossoms = Math.floor(daysCount / 3);
  const stageLabel =
    daysCount >= 14
      ? 'Blühender Abenteuerbaum'
      : daysCount >= 7
        ? 'Kräftiger Klötzchenbaum'
        : daysCount >= 3
          ? 'Junges Bäumchen'
          : 'Frischer Setzling';
  return { daysCount, leaves, blossoms, stageLabel };
}

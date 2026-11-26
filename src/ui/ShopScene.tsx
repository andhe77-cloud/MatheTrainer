import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Compass, Heart, Play } from 'lucide-react';
import { CATALOG_ITEMS, findCatalogItem, type CatalogCategory } from '../content/catalog';
import { soundEngine } from '../core/audio';
import type { AppStateV1 } from '../core/types';
import { CatalogItemArt } from './CatalogArt';
import { FullscreenButton } from './DesignSystem';
import { WorldBackdrop } from './WorldBackdrop';

interface ShopSceneProps {
  state: AppStateV1;
  onBuyItem: (itemId: string) => void;
  onToggleWishlist: (itemId: string) => void;
  onEquipAccessory: (slot: 'hat' | 'cape' | 'backpack' | 'hopEffect', itemId: string | null) => void;
  onPlayMinigame?: (catalogItemId: string) => void;
  dailyDone?: boolean;
  initialTabId?: string;
  onBack: () => void;
}

const SHOP_TABS: Array<{ id: string; label: string; cats: CatalogCategory[] }> = [
  { id: 'bau', label: 'Bauklötze & Pflanzen', cats: ['baustein', 'pflanze', 'deko'] },
  { id: 'welt', label: 'Tiere, Häuser & Fahrzeuge', cats: ['tier', 'gebaeude', 'fahrzeug'] },
  { id: 'tier', label: 'Tier-Kleidung & Effekte', cats: ['hat', 'cape', 'backpack', 'hopEffect'] },
  { id: 'spiele', label: 'Minispiele', cats: ['minigame'] },
];

export const ShopScene: React.FC<ShopSceneProps> = ({
  state,
  onBuyItem,
  onToggleWishlist,
  onEquipAccessory,
  onPlayMinigame,
  dailyDone = true,
  initialTabId,
  onBack,
}) => {
  const coins = state.profile?.coins ?? 0;
  const [tabIdx, setTabIdx] = useState(() => {
    if (!initialTabId) return 0;
    const found = SHOP_TABS.findIndex((t) => t.id === initialTabId);
    return found >= 0 ? found : 0;
  });
  const [page, setPage] = useState(0);

  const activeTab = SHOP_TABS[tabIdx];
  const tabItems = CATALOG_ITEMS.filter((it) => activeTab.cats.includes(it.category));
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(tabItems.length / pageSize));
  const visibleItems = tabItems.slice(page * pageSize, page * pageSize + pageSize);

  const wishlistItem = findCatalogItem(state.wishlistItemId);
  const wishPct = wishlistItem ? Math.min(100, Math.round((coins / wishlistItem.price) * 100)) : 0;

  return (
    <div className="h-dvh overflow-hidden relative p-2.5 sm:p-4 short:p-2 flex flex-col gap-2 sm:gap-3 short:gap-1.5">
      <WorldBackdrop worldId={0} scrimClass="bg-amber-50/30" />
      {/* Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 short:py-1 shadow-[0_3px_0_#CBD5E1] flex items-center justify-between gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] sm:min-h-[44px] short:min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Karte</span>
        </button>

        <h1 className="text-base sm:text-xl short:text-sm font-extrabold text-slate-900 truncate">Klötzchen-Laden</h1>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-amber-50 border-2 border-amber-300 font-extrabold text-amber-800 text-xs sm:text-sm tabular-nums whitespace-nowrap">
            {coins} Goldklötzchen
          </div>
          <FullscreenButton compact />
        </div>
      </header>

      {/* Tabs + Wishlist Progress */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {SHOP_TABS.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                setTabIdx(idx);
                setPage(0);
              }}
              className={`min-h-[40px] sm:min-h-[44px] short:min-h-[34px] px-3 sm:px-4 py-1.5 rounded-xl border-2 text-xs sm:text-sm short:text-xs font-bold ${
                tabIdx === idx
                  ? 'bg-blue-600 border-blue-700 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {wishlistItem && (
          <div className="bg-white rounded-xl border-2 border-amber-300 px-3 py-1 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-800">Wunsch: {wishlistItem.name}</span>
              <span className="ml-2 font-extrabold text-amber-700 tabular-nums">
                {coins}/{wishlistItem.price} ({wishPct}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Paginated 8-Card Grid (scroll-safe on narrow portrait; 4x2 at 640px+) */}
      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar max-w-6xl w-full mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 short:gap-2 content-start sm:content-stretch pb-1">
        {visibleItems.map((item) => {
          const owned = state.inventory.includes(item.id);
          const affordable = coins >= item.price;
          const isWished = state.wishlistItemId === item.id;
          const equipSlot =
            item.category === 'hat' ||
            item.category === 'cape' ||
            item.category === 'backpack' ||
            item.category === 'hopEffect'
              ? item.category
              : null;
          const isEquipped = equipSlot ? state.equippedAccessories[equipSlot] === item.id : false;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border-2 border-slate-200 p-2.5 sm:p-3 short:p-2 shadow-[0_4px_0_#CBD5E1] flex flex-col justify-between gap-1.5 short:gap-1"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900 leading-tight">{item.name}</span>
                {!owned && (
                  <button
                    type="button"
                    onClick={() => onToggleWishlist(item.id)}
                    aria-label="Auf den Wunschzettel"
                    className="p-1 rounded-lg hover:bg-rose-50"
                  >
                    <Heart
                      className={`w-4 h-4 ${isWished ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`}
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center py-0.5 [&_svg]:w-11 [&_svg]:h-11 sm:[&_svg]:w-[52px] sm:[&_svg]:h-[52px] short:[&_svg]:w-8 short:[&_svg]:h-8">
                <CatalogItemArt item={item} size={52} />
              </div>

              {item.category === 'minigame' && (
                <p className="text-[11px] text-slate-600 leading-snug text-center line-clamp-2 short:hidden">
                  {item.description}
                </p>
              )}

              {owned ? (
                item.category === 'minigame' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (dailyDone) {
                        soundEngine.playSuccessChime();
                      } else {
                        soundEngine.playUiClick();
                      }
                      onPlayMinigame?.(item.id);
                    }}
                    className={`min-h-[42px] short:min-h-[34px] w-full rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 ${
                      dailyDone
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_3px_0_#4338CA]'
                        : 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950'
                    }`}
                  >
                    {dailyDone ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Jetzt spielen!</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5 text-amber-700" />
                        <span>Erst Tagesaufgabe</span>
                      </>
                    )}
                  </button>
                ) : equipSlot ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playBlockTap();
                      onEquipAccessory(equipSlot, isEquipped ? null : item.id);
                    }}
                    className={`min-h-[42px] short:min-h-[34px] w-full rounded-xl font-bold text-xs flex items-center justify-center gap-1 ${
                      isEquipped
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 border border-blue-300 text-blue-800'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isEquipped ? 'Angezogen' : 'Anziehen'}</span>
                  </button>
                ) : (
                  <div className="min-h-[42px] short:min-h-[34px] w-full rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>Gehört dir</span>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  disabled={!affordable}
                  onClick={() => {
                    soundEngine.playCoinClink();
                    onBuyItem(item.id);
                  }}
                  className={`min-h-[42px] short:min-h-[34px] w-full rounded-xl font-extrabold text-xs transition-all ${
                    affordable
                      ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-[0_3px_0_#D97706]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {item.price} Goldklötzchen
                </button>
              )}
            </div>
          );
        })}
      </main>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <footer className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-center gap-4 shrink-0">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="min-h-[42px] short:min-h-[34px] px-4 rounded-xl border border-slate-300 bg-white disabled:opacity-40 font-bold text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>
          <span className="text-xs font-bold text-slate-600">
            Seite {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="min-h-[42px] short:min-h-[34px] px-4 rounded-xl border border-slate-300 bg-white disabled:opacity-40 font-bold text-xs flex items-center gap-1"
          >
            <span>Weiter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      )}
    </div>
  );
};

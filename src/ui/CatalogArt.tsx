import React from 'react';
import { Sparkles } from 'lucide-react';
import type { AlbumSticker, CatalogItem } from '../content/catalog';

export const CatalogItemArt: React.FC<{ item: CatalogItem; size?: number; sway?: boolean }> = ({
  item,
  size = 48,
  sway = false,
}) => {
  const anim = sway && item.category === 'pflanze' ? 'animate-plant-sway' : '';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`shrink-0 ${anim}`}>
      {item.shape === 'block' && (
        <g>
          <rect x="10" y="20" width="44" height="32" rx="6" fill={item.secondaryHex} />
          <rect x="10" y="14" width="44" height="30" rx="6" fill={item.primaryHex} />
          <rect x="16" y="8" width="12" height="8" rx="3" fill={item.primaryHex} />
          <rect x="36" y="8" width="12" height="8" rx="3" fill={item.primaryHex} />
        </g>
      )}
      {item.shape === 'flower' && (
        <g>
          <rect x="29" y="28" width="6" height="28" rx="2" fill="#16A34A" />
          <rect x="20" y="40" width="12" height="6" rx="3" fill="#22C55E" />
          <circle cx="32" cy="18" r="8" fill={item.primaryHex} />
          <circle cx="22" cy="24" r="6" fill={item.primaryHex} />
          <circle cx="42" cy="24" r="6" fill={item.primaryHex} />
          <circle cx="32" cy="24" r="5" fill="#F59E0B" />
        </g>
      )}
      {(item.shape === 'tree' || item.shape === 'bush') && (
        <g>
          {item.shape === 'tree' && <rect x="26" y="34" width="12" height="22" rx="3" fill={item.secondaryHex} />}
          <rect x="14" y="16" width="36" height="26" rx="9" fill={item.primaryHex} />
          <rect x="20" y="8" width="24" height="14" rx="6" fill={item.primaryHex} />
          {item.shape === 'bush' && (
            <>
              <circle cx="24" cy="26" r="3.5" fill={item.secondaryHex} />
              <circle cx="38" cy="30" r="3.5" fill={item.secondaryHex} />
            </>
          )}
        </g>
      )}
      {(item.shape === 'duck' || item.shape === 'sheep' || item.shape === 'frog' || item.shape === 'cat' || item.shape === 'dog') && (
        <g>
          <rect x="16" y="28" width="32" height="22" rx="7" fill={item.primaryHex} />
          <rect x="18" y="14" width="22" height="20" rx="6" fill={item.primaryHex} />
          <rect x="12" y="20" width="8" height="6" rx="2" fill={item.secondaryHex} />
          <rect x="20" y="48" width="6" height="8" rx="2" fill={item.secondaryHex} />
          <rect x="38" y="48" width="6" height="8" rx="2" fill={item.secondaryHex} />
          <circle cx="25" cy="22" r="2.2" fill="#0F172A" />
        </g>
      )}
      {(item.shape === 'house' || item.shape === 'tower' || item.shape === 'windmill' || item.shape === 'bridge') && (
        <g>
          {item.shape === 'bridge' ? (
            <>
              <rect x="6" y="38" width="52" height="14" rx="4" fill={item.secondaryHex} />
              <rect x="10" y="22" width="44" height="18" rx="6" fill={item.primaryHex} />
            </>
          ) : (
            <>
              <rect x="14" y="26" width="36" height="28" rx="4" fill={item.primaryHex} />
              <polygon points="10,28 32,8 54,28" fill={item.secondaryHex} />
              <rect x="27" y="38" width="10" height="16" rx="2" fill="#FFFBEB" />
              {item.shape === 'windmill' && (
                <path d="M16 14 L48 38 M48 14 L16 38" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
              )}
            </>
          )}
        </g>
      )}
      {(item.shape === 'car' || item.shape === 'train' || item.shape === 'boat' || item.shape === 'balloon') && (
        <g>
          {item.shape === 'balloon' ? (
            <>
              <ellipse cx="32" cy="24" rx="18" ry="18" fill={item.primaryHex} />
              <rect x="26" y="46" width="12" height="10" rx="2" fill={item.secondaryHex} />
              <line x1="26" y1="46" x2="22" y2="38" stroke="#475569" strokeWidth="2" />
              <line x1="38" y1="46" x2="42" y2="38" stroke="#475569" strokeWidth="2" />
            </>
          ) : item.shape === 'boat' ? (
            <>
              <polygon points="10,40 54,40 46,54 18,54" fill={item.primaryHex} />
              <polygon points="32,10 32,38 50,38" fill={item.secondaryHex} />
            </>
          ) : (
            <>
              <rect x="10" y="24" width="44" height="20" rx="6" fill={item.primaryHex} />
              <rect x="22" y="14" width="22" height="12" rx="4" fill={item.secondaryHex} />
              <circle cx="20" cy="46" r="7" fill="#1E293B" />
              <circle cx="44" cy="46" r="7" fill="#1E293B" />
            </>
          )}
        </g>
      )}
      {(item.shape === 'lamp' || item.shape === 'bench' || item.shape === 'fountain' || item.shape === 'flag') && (
        <g>
          {item.shape === 'flag' ? (
            <>
              <rect x="18" y="10" width="5" height="46" rx="2" fill="#475569" />
              <polygon points="23,12 52,20 23,30" fill={item.primaryHex} />
            </>
          ) : item.shape === 'lamp' ? (
            <>
              <rect x="29" y="24" width="6" height="32" rx="2" fill={item.secondaryHex} />
              <rect x="21" y="10" width="22" height="16" rx="5" fill={item.primaryHex} />
            </>
          ) : item.shape === 'fountain' ? (
            <>
              <rect x="10" y="38" width="44" height="16" rx="6" fill={item.secondaryHex} />
              <rect x="24" y="24" width="16" height="16" rx="4" fill={item.primaryHex} />
              <circle cx="32" cy="16" r="7" fill="#BAE6FD" />
            </>
          ) : (
            <>
              <rect x="10" y="26" width="44" height="14" rx="4" fill={item.primaryHex} />
              <rect x="14" y="40" width="6" height="14" rx="2" fill={item.secondaryHex} />
              <rect x="44" y="40" width="6" height="14" rx="2" fill={item.secondaryHex} />
            </>
          )}
        </g>
      )}
      {(item.shape === 'hat' || item.shape === 'cap' || item.shape === 'crown') && (
        <g>
          {item.shape === 'crown' ? (
            <polygon points="12,44 12,20 24,32 32,14 40,32 52,20 52,44" fill={item.primaryHex} stroke={item.secondaryHex} strokeWidth="3" />
          ) : (
            <>
              <rect x="16" y="18" width="32" height="22" rx="8" fill={item.primaryHex} />
              <rect x="8" y="36" width="48" height="8" rx="4" fill={item.secondaryHex} />
            </>
          )}
        </g>
      )}
      {item.shape === 'cape' && (
        <polygon points="20,14 44,14 54,54 10,54" fill={item.primaryHex} stroke={item.secondaryHex} strokeWidth="3" />
      )}
      {item.shape === 'backpack' && (
        <g>
          <rect x="16" y="16" width="32" height="36" rx="8" fill={item.primaryHex} />
          <rect x="20" y="30" width="24" height="14" rx="4" fill={item.secondaryHex} />
        </g>
      )}
      {item.shape === 'effect' && (
        <g>
          <polygon points="32,8 38,24 54,24 41,34 46,50 32,40 18,50 23,34 10,24 26,24" fill={item.primaryHex} />
          <circle cx="16" cy="14" r="4" fill={item.secondaryHex} />
          <circle cx="50" cy="48" r="4" fill={item.secondaryHex} />
        </g>
      )}
    </svg>
  );
};

export const StickerArt: React.FC<{ sticker: AlbumSticker; locked?: boolean; size?: number }> = ({
  sticker,
  locked = false,
  size = 56,
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  const resolvedSrc = React.useMemo(() => {
    const base = import.meta.env.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    return `${normalizedBase}${sticker.imageUrl.replace(/^\/+/, '')}`;
  }, [sticker.imageUrl]);

  React.useEffect(() => {
    setImgFailed(false);
  }, [resolvedSrc]);

  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-2xl bg-white border-2 border-slate-200 shadow-xs flex items-center justify-center overflow-hidden p-1 ${
        locked ? 'opacity-30 grayscale' : ''
      }`}
    >
      {!imgFailed ? (
        <img
          src={resolvedSrc}
          alt={sticker.title}
          loading="lazy"
          className="w-full h-full object-contain rounded-xl"
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth === 0) {
              setImgFailed(true);
            }
          }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className="w-full h-full rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${sticker.primaryHex}22` }}
        >
          <Sparkles className="w-6 h-6" style={{ color: sticker.primaryHex }} />
        </div>
      )}
    </div>
  );
};

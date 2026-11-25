import React from 'react';
import type { AnimalType, MascotMood } from '../core/types';

interface MascotProps {
  animal: AnimalType;
  mood?: MascotMood;
  size?: number;
  reducedMotion?: boolean;
  equipped?: {
    hat?: string | null;
    cape?: string | null;
    backpack?: string | null;
    hopEffect?: string | null;
  };
  onClick?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  animal,
  mood = 'idle',
  size = 128,
  reducedMotion = false,
  equipped,
  onClick,
}) => {
  const animClass = reducedMotion
    ? ''
    : mood === 'hop'
      ? 'animate-mascot-hop'
      : mood === 'happy'
        ? 'animate-mascot-happy'
        : mood === 'hm'
          ? 'animate-mascot-hm'
          : mood === 'yawn'
            ? 'animate-mascot-yawn'
            : mood === 'nod'
              ? 'animate-mascot-nod'
              : 'animate-mascot-idle';

  const eyeHeight = mood === 'happy' ? 3 : mood === 'tired' || mood === 'yawn' ? 2 : 7;

  const baseClass = `relative inline-flex flex-col items-center justify-end select-none focus:outline-none ${
    onClick ? 'cursor-pointer active:scale-95 transition-transform' : 'cursor-default'
  }`;

  const innerContent = (
    <>
      {/* Dust / Sparkle particles on hop/happy */}
      {!reducedMotion && (mood === 'hop' || mood === 'happy') && (
        <svg viewBox="0 0 120 24" className="absolute -bottom-1 w-full h-5 pointer-events-none">
          <rect
            x="18"
            y="10"
            width="8"
            height="8"
            rx="2"
            fill={equipped?.hopEffect === 'fx_rainbow' ? '#EC4899' : equipped?.hopEffect === 'fx_sparkle' ? '#FACC15' : '#CBD5E1'}
            opacity="0.85"
          />
          <rect
            x="94"
            y="8"
            width="9"
            height="9"
            rx="2"
            fill={equipped?.hopEffect === 'fx_rainbow' ? '#22C55E' : equipped?.hopEffect === 'fx_sparkle' ? '#38BDF8' : '#CBD5E1'}
            opacity="0.8"
          />
          <rect
            x="30"
            y="14"
            width="6"
            height="6"
            rx="2"
            fill={equipped?.hopEffect === 'fx_rainbow' ? '#3B82F6' : '#E2E8F0'}
            opacity="0.85"
          />
        </svg>
      )}

      <svg
        viewBox="0 0 120 122"
        className={`w-full h-full overflow-visible ${animClass}`}
      >
        {/* Ground shadow beneath feet */}
        <ellipse
          cx="60"
          cy="112"
          rx={mood === 'hop' && !reducedMotion ? 24 : 32}
          ry="5"
          fill="#0F172A"
          opacity={mood === 'hop' && !reducedMotion ? 0.10 : 0.16}
        />

        {/* Cape behind body */}
        {equipped?.cape && (
          <polygon
            points="34,64 86,64 98,108 22,108"
            fill={equipped.cape === 'cape_star' ? '#1D4ED8' : '#E11D48'}
            stroke={equipped.cape === 'cape_star' ? '#FACC15' : '#FB7185'}
            strokeWidth="3"
          />
        )}

        {/* Backpack peeks at side */}
        {equipped?.backpack && (
          <rect
            x="80"
            y="66"
            width="16"
            height="28"
            rx="5"
            fill={equipped.backpack === 'pack_rocket' ? '#64748B' : '#059669'}
            stroke={equipped.backpack === 'pack_rocket' ? '#F97316' : '#D97706'}
            strokeWidth="2.5"
          />
        )}

        {animal === 'fuchs' && (
          <g>
            {/* Bushy block tail */}
            <rect x="8" y="64" width="28" height="22" rx="6" fill="#EA580C" />
            <rect x="6" y="60" width="12" height="12" rx="4" fill="#FFF7ED" />
            {/* Ears with block studs */}
            <polygon points="28,32 42,10 52,32" fill="#C2410C" />
            <polygon points="34,30 42,16 48,30" fill="#FED7AA" />
            <polygon points="68,32 78,10 92,32" fill="#C2410C" />
            <polygon points="72,30 78,16 86,30" fill="#FED7AA" />
            {/* Body block */}
            <rect x="32" y="64" width="56" height="40" rx="10" fill="#EA580C" />
            <rect x="44" y="72" width="32" height="28" rx="7" fill="#FFF7ED" />
            {/* Feet blocks */}
            <rect x="36" y="98" width="16" height="12" rx="4" fill="#7C2D12" />
            <rect x="68" y="98" width="16" height="12" rx="4" fill="#7C2D12" />
            {/* Head block */}
            <rect x="24" y="26" width="72" height="46" rx="12" fill="#F97316" />
            {/* White cheek blocks */}
            <rect x="24" y="50" width="24" height="20" rx="6" fill="#FFF7ED" />
            <rect x="72" y="50" width="24" height="20" rx="6" fill="#FFF7ED" />
            {/* Snout */}
            <rect x="48" y="52" width="24" height="18" rx="6" fill="#FFEDD5" />
            <rect x="55" y="54" width="10" height="7" rx="3" fill="#1E293B" />
            {/* Eyes */}
            <rect x="38" y={mood === 'happy' ? 43 : 40} width="9" height={eyeHeight} rx="3" fill="#0F172A" />
            <rect x="73" y={mood === 'happy' ? 43 : 40} width="9" height={eyeHeight} rx="3" fill="#0F172A" />
            {eyeHeight > 4 && (
              <>
                <circle cx="41" cy="42" r="1.5" fill="#FFFFFF" />
                <circle cx="76" cy="42" r="1.5" fill="#FFFFFF" />
              </>
            )}
          </g>
        )}

        {animal === 'axolotl' && (
          <g>
            {/* Side gill blocks */}
            <rect x="10" y="34" width="16" height="8" rx="3" fill="#E11D48" />
            <rect x="8" y="46" width="18" height="8" rx="3" fill="#F43F5E" />
            <rect x="94" y="34" width="16" height="8" rx="3" fill="#E11D48" />
            <rect x="94" y="46" width="18" height="8" rx="3" fill="#F43F5E" />
            {/* Tail block */}
            <rect x="14" y="72" width="24" height="18" rx="6" fill="#FDA4AF" />
            {/* Body block */}
            <rect x="32" y="64" width="56" height="40" rx="11" fill="#FB7185" />
            <rect x="44" y="70" width="32" height="28" rx="8" fill="#FFE4E6" />
            {/* Feet blocks */}
            <rect x="36" y="98" width="15" height="11" rx="4" fill="#E11D48" />
            <rect x="69" y="98" width="15" height="11" rx="4" fill="#E11D48" />
            {/* Top block stud */}
            <rect x="48" y="20" width="24" height="10" rx="4" fill="#FDA4AF" />
            {/* Head block */}
            <rect x="24" y="28" width="72" height="44" rx="13" fill="#FDA4AF" />
            {/* Eyes */}
            <rect x="37" y={mood === 'happy' ? 45 : 42} width="9" height={eyeHeight} rx="3" fill="#0F172A" />
            <rect x="74" y={mood === 'happy' ? 45 : 42} width="9" height={eyeHeight} rx="3" fill="#0F172A" />
            {eyeHeight > 4 && (
              <>
                <circle cx="40" cy="44" r="1.5" fill="#FFFFFF" />
                <circle cx="77" cy="44" r="1.5" fill="#FFFFFF" />
              </>
            )}
            {/* Smile */}
            {mood === 'hm' ? (
              <circle cx="60" cy="58" r="3.5" fill="#881337" />
            ) : mood === 'yawn' ? (
              <ellipse cx="60" cy="59" rx="5" ry="6" fill="#881337" />
            ) : (
              <path d="M 50 56 Q 60 63 70 56" fill="none" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
            )}
          </g>
        )}

        {animal === 'hase' && (
          <g>
            {/* Tall block ears */}
            <rect x="34" y="4" width="15" height="30" rx="6" fill="#E2E8F0" />
            <rect x="38" y="10" width="7" height="20" rx="3" fill="#FDA4AF" />
            <rect x="71" y="4" width="15" height="30" rx="6" fill="#E2E8F0" />
            <rect x="75" y="10" width="7" height="20" rx="3" fill="#FDA4AF" />
            {/* Fluffy tail */}
            <rect x="18" y="76" width="16" height="16" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
            {/* Body block */}
            <rect x="32" y="66" width="56" height="38" rx="10" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="44" y="72" width="32" height="26" rx="7" fill="#FFFFFF" />
            {/* Feet blocks */}
            <rect x="34" y="98" width="18" height="12" rx="4" fill="#CBD5E1" />
            <rect x="68" y="98" width="18" height="12" rx="4" fill="#CBD5E1" />
            {/* Head block */}
            <rect x="26" y="28" width="68" height="44" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
            {/* Nose */}
            <rect x="55" y="52" width="10" height="7" rx="3" fill="#FB7185" />
            {/* Eyes */}
            <rect x="38" y={mood === 'happy' ? 43 : 40} width="9" height={eyeHeight} rx="3" fill="#0F172A" />
            <rect x="73" y={mood === 'happy' ? 43 : 40} width="9" height={eyeHeight} rx="3" fill="#0F172A" />
            {eyeHeight > 4 && (
              <>
                <circle cx="41" cy="42" r="1.5" fill="#FFFFFF" />
                <circle cx="76" cy="42" r="1.5" fill="#FFFFFF" />
              </>
            )}
          </g>
        )}

        {/* Hats perched neatly atop head */}
        {equipped?.hat === 'hat_crown' && (
          <polygon points="40,26 40,8 50,18 60,4 70,18 80,8 80,26" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        )}
        {equipped?.hat === 'hat_cap' && (
          <g>
            <rect x="40" y="10" width="36" height="16" rx="7" fill="#2563EB" />
            <rect x="34" y="22" width="54" height="6" rx="3" fill="#60A5FA" />
          </g>
        )}
        {equipped?.hat === 'hat_straw' && (
          <g>
            <rect x="42" y="10" width="36" height="14" rx="5" fill="#FDE047" />
            <rect x="30" y="22" width="60" height="6" rx="3" fill="#D97706" />
          </g>
        )}
        {equipped?.hat === 'hat_wizard' && (
          <g>
            <polygon points="38,26 60,-2 82,26" fill="#7C3AED" stroke="#FACC15" strokeWidth="2" />
            <rect x="32" y="22" width="56" height="6" rx="3" fill="#6D28D9" />
          </g>
        )}

        {/* Thought bubble for "Hm?" */}
        {mood === 'hm' && (
          <g transform="translate(86, 6)">
            <rect x="0" y="0" width="28" height="24" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
            <text x="14" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#92400E">
              ?
            </text>
          </g>
        )}
      </svg>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Tierfigur ${animal}`}
        className={baseClass}
        style={{ width: size, height: size }}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Tierfigur ${animal}`}
      className={baseClass}
      style={{ width: size, height: size }}
    >
      {innerContent}
    </div>
  );
};

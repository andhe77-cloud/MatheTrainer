import React from 'react';
import bgMapMeadow from '../assets/images/bg_map_meadow_island_1795603311850.jpg';
import bgWorld1 from '../assets/images/bg_world1_bauplatte_1795603308938.jpg';
import bgWorld2 from '../assets/images/bg_world2_brueckental_1795603309379.jpg';
import bgWorld3 from '../assets/images/bg_world3_zehnerschlucht_1795603310600.jpg';
import bgWorld4 from '../assets/images/bg_world4_rechenwerkstatt_1795603311181.jpg';
import bgWorld5 from '../assets/images/bg_world5_mauerburg_1795603311624.jpg';

interface WorldBackdropProps {
  worldId: number;
  isDaily?: boolean;
  scrimClass?: string;
}

const BACKDROP_CONFIG: Record<number, { src: string; fallback: string; scrim: string }> = {
  0: {
    src: bgMapMeadow,
    fallback: 'from-sky-200 via-sky-100 to-emerald-100',
    scrim: 'bg-white/18',
  },
  1: {
    src: bgWorld1,
    fallback: 'from-sky-200 via-sky-100 to-blue-100',
    scrim: 'bg-white/20',
  },
  2: {
    src: bgWorld2,
    fallback: 'from-sky-100 via-teal-50 to-cyan-100',
    scrim: 'bg-white/20',
  },
  3: {
    src: bgWorld3,
    fallback: 'from-amber-100 via-orange-50 to-amber-200',
    scrim: 'bg-amber-50/22',
  },
  4: {
    src: bgWorld4,
    fallback: 'from-emerald-100 via-teal-50 to-emerald-200',
    scrim: 'bg-white/18',
  },
  5: {
    src: bgWorld5,
    fallback: 'from-violet-100 via-purple-50 to-indigo-100',
    scrim: 'bg-white/20',
  },
};

export const WorldBackdrop: React.FC<WorldBackdropProps> = ({
  worldId,
  isDaily = false,
  scrimClass,
}) => {
  const key = isDaily ? 0 : worldId in BACKDROP_CONFIG ? worldId : 0;
  const cfg = BACKDROP_CONFIG[key] ?? BACKDROP_CONFIG[0];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden bg-gradient-to-b ${cfg.fallback}`}
    >
      <img
        src={cfg.src}
        alt=""
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center select-none"
      />
      <div className={`absolute inset-0 ${scrimClass ?? cfg.scrim}`} />
    </div>
  );
};

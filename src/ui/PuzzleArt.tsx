import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import type { PuzzlePicture } from '../content/catalog';
import pzAstronautPanda from '../assets/images/puzzle_astronaut_panda_1795605925544.jpg';
import pzBalloonFestival from '../assets/images/puzzle_balloon_festival_1795605929563.jpg';
import pzConstructionSite from '../assets/images/puzzle_construction_site_1795605933096.jpg';
import pzDinosaurs from '../assets/images/puzzle_dinosaurs_1795605924079.jpg';
import pzFarmFriends from '../assets/images/puzzle_farm_friends_1795605967732.jpg';
import pzFiretruck from '../assets/images/puzzle_firetruck_1795605923515.jpg';
import pzKnightCastle from '../assets/images/puzzle_knight_castle_1795605927464.jpg';
import pzOceanWhale from '../assets/images/puzzle_ocean_whale_1795605925513.jpg';
import pzPirateShip from '../assets/images/puzzle_pirate_ship_1795605927433.jpg';
import pzRacecar from '../assets/images/puzzle_racecar_1795605922474.jpg';
import pzSafariAnimals from '../assets/images/puzzle_safari_animals_1795605925763.jpg';
import pzSoccerStadium from '../assets/images/puzzle_soccer_stadium_1795606021504.jpg';
import pzSpaceRocket from '../assets/images/puzzle_space_rocket_1795605923909.jpg';
import pzSteamTrain from '../assets/images/puzzle_steam_train_1795605928105.jpg';
import pzTreehouse from '../assets/images/puzzle_treehouse_1795606019603.jpg';

const PUZZLE_IMAGE_MAP: Record<string, string> = {
  pz_racecar: pzRacecar,
  pz_firetruck: pzFiretruck,
  pz_rocket: pzSpaceRocket,
  pz_astronaut_panda: pzAstronautPanda,
  pz_dinosaurs: pzDinosaurs,
  pz_ocean_whale: pzOceanWhale,
  pz_safari: pzSafariAnimals,
  pz_farm: pzFarmFriends,
  pz_castle: pzKnightCastle,
  pz_pirate: pzPirateShip,
  pz_train: pzSteamTrain,
  pz_construction: pzConstructionSite,
  pz_balloons: pzBalloonFestival,
  pz_treehouse: pzTreehouse,
  pz_soccer: pzSoccerStadium,
};

export const PuzzleGridCard: React.FC<{
  puzzle: PuzzlePicture;
  unlockedPieces: number[];
  compact?: boolean;
  highlightPiece?: number | null;
}> = ({ puzzle, unlockedPieces, compact = false, highlightPiece = null }) => {
  const src = PUZZLE_IMAGE_MAP[puzzle.id] ?? pzRacecar;
  const ownedSet = new Set(unlockedPieces);
  const allComplete = ownedSet.size >= puzzle.piecesCount;

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-300 shadow-inner select-none">
      {ownedSet.size > 0 && (
        <img
          src={src}
          alt={allComplete ? puzzle.title : `${puzzle.title} (${ownedSet.size}/${puzzle.piecesCount} Teile)`}
          className="w-full h-full object-cover"
        />
      )}

      {/* 3x2 Overlay Tile Grid: locked pieces remain opaque Klötzchen covers */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
        {Array.from({ length: puzzle.piecesCount }).map((_, idx) => {
          const isUnlocked = ownedSet.has(idx);
          const isHighlighted = highlightPiece === idx;
          if (isUnlocked) {
            return (
              <div
                key={idx}
                className={`border border-white/25 transition-all ${
                  isHighlighted ? 'ring-3 ring-amber-400 ring-inset bg-amber-300/15' : ''
                }`}
              />
            );
          }
          return (
            <div
              key={idx}
              className="bg-slate-800 border border-slate-700/90 flex flex-col items-center justify-center gap-0.5 text-slate-400"
            >
              <Lock className={compact ? 'w-3.5 h-3.5 text-slate-400' : 'w-5 h-5 text-slate-400'} />
              {!compact && (
                <span className="text-[10px] font-extrabold text-slate-400 tabular-nums">
                  Teil {idx + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {allComplete && (
        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-extrabold shadow-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Komplett</span>
        </span>
      )}
    </div>
  );
};

export const PuzzlePiecePreview: React.FC<{
  puzzle: PuzzlePicture;
  pieceIndex: number;
  width?: number;
}> = ({ puzzle, pieceIndex, width = 76 }) => {
  const src = PUZZLE_IMAGE_MAP[puzzle.id] ?? pzRacecar;
  const col = pieceIndex % 3; // 0, 1, 2
  const row = Math.floor(pieceIndex / 3); // 0, 1
  const height = Math.round(width * 0.75);

  return (
    <div
      style={{
        width,
        height,
        backgroundImage: `url(${src})`,
        backgroundSize: '300% 200%',
        backgroundPosition: `${col * 50}% ${row * 100}%`,
      }}
      className="shrink-0 rounded-xl border-2 border-amber-400 shadow-xs bg-amber-50"
      aria-label={`Puzzleteil ${pieceIndex + 1} von ${puzzle.title}`}
    />
  );
};

import React, { useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import type { AnimalType } from '../core/types';
import { PWAInstallButton, FullscreenButton } from './DesignSystem';
import { Mascot } from './Mascot';
import { WorldBackdrop } from './WorldBackdrop';

interface WelcomeSceneProps {
  onComplete: (animal: AnimalType, animalName: string, startTraining: boolean) => void;
}

const ANIMAL_OPTIONS: AnimalType[] = ['fuchs', 'axolotl', 'hase'];

export const WelcomeScene: React.FC<WelcomeSceneProps> = ({ onComplete }) => {
  const [selected, setSelected] = useState<AnimalType>('fuchs');
  const [petName, setPetName] = useState<string>(STRINGS_DE.animals.fuchs.defaultPetName);

  const handleSelectAnimal = (animal: AnimalType) => {
    soundEngine.playBlockTap();
    setSelected(animal);
    setPetName(STRINGS_DE.animals[animal].defaultPetName);
  };

  const finalName = petName.trim() || STRINGS_DE.animals[selected].defaultPetName;

  return (
    <div className="h-dvh overflow-y-auto no-scrollbar relative flex flex-col p-3 sm:p-6 short:p-2">
      <WorldBackdrop worldId={0} />
      <div className="relative z-10 my-auto mx-auto w-full max-w-4xl bg-white/95 rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_#CBD5E1] p-4 sm:p-7 short:p-4 space-y-4 sm:space-y-5 short:space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-blue-700">{STRINGS_DE.app.title}</p>
            <h1 className="text-xl sm:text-3xl short:text-lg font-bold text-slate-900 mt-0.5 text-balance">
              {STRINGS_DE.welcome.heading}
            </h1>
            <p className="text-slate-600 text-xs sm:text-base short:text-xs mt-0.5">{STRINGS_DE.welcome.subheading}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <FullscreenButton />
          </div>
        </div>

        {/* 3 Animal Block Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 short:gap-2">
          {ANIMAL_OPTIONS.map((animal) => {
            const info = STRINGS_DE.animals[animal];
            const isSelected = selected === animal;
            return (
              <button
                key={animal}
                type="button"
                onClick={() => handleSelectAnimal(animal)}
                className={`rounded-2xl sm:rounded-3xl p-2 sm:p-4 short:p-2 border-2 flex flex-col items-center text-center gap-1.5 sm:gap-2 short:gap-1 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-[0_5px_0_#2563EB] -translate-y-0.5'
                    : 'border-slate-200 bg-white hover:bg-slate-50 shadow-[0_4px_0_#CBD5E1]'
                }`}
              >
                <div className="[&>div]:!w-16 [&>div]:!h-16 sm:[&>div]:!w-[92px] sm:[&>div]:!h-[92px] short:[&>div]:!w-12 short:[&>div]:!h-12">
                  <Mascot animal={animal} mood={isSelected ? 'hop' : 'idle'} size={92} />
                </div>
                <div>
                  <div className="text-sm sm:text-lg short:text-sm font-bold text-slate-900">{info.name}</div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-snug hidden sm:block short:hidden">{info.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Name Input & Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 sm:gap-4 pt-2 border-t border-slate-100">
          <div className="w-full md:w-56 shrink-0">
            <label htmlFor="pet-name" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1 whitespace-nowrap">
              {STRINGS_DE.welcome.nameLabel}
            </label>
            <input
              id="pet-name"
              type="text"
              maxLength={20}
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder={STRINGS_DE.welcome.namePlaceholder}
              className="w-full min-h-[48px] sm:min-h-[56px] short:min-h-[44px] px-3.5 py-2 rounded-2xl border-2 border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none text-base sm:text-lg font-bold text-slate-900"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playBlockTap();
                onComplete(selected, finalName, false);
              }}
              className="flex-1 sm:flex-none min-h-[52px] sm:min-h-[64px] short:min-h-[46px] px-4 sm:px-5 py-2.5 rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base shadow-[0_4px_0_#CBD5E1] active:translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              <span>{STRINGS_DE.welcome.skipToMapButton}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccessChime();
                onComplete(selected, finalName, true);
              }}
              className="flex-1 sm:flex-none min-h-[52px] sm:min-h-[64px] short:min-h-[46px] px-5 sm:px-7 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg shadow-[0_5px_0_#047857] active:translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>{STRINGS_DE.welcome.startTrainingButton}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

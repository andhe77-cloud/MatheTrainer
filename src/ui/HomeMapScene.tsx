import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Compass,
  FlaskConical,
  Hammer,
  Lock,
  Megaphone,
  MegaphoneOff,
  Play,
  ShoppingBag,
  Sparkles,
  Star,
  Trees,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { APP_CONFIG } from '../content/config';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import { createRng } from '../core/rng';
import type { AppStateV1, MascotMood, SceneId } from '../core/types';
import type { ActiveErrorPattern } from '../diagnostics/patterns';
import { calculateFleissbaumProgress } from '../rewards/economy';
import { FullscreenButton, PWAInstallButton } from './DesignSystem';
import { Mascot } from './Mascot';
import { WorldBackdrop } from './WorldBackdrop';

interface HomeMapSceneProps {
  state: AppStateV1;
  activePatterns: ActiveErrorPattern[];
  onNavigate: (scene: SceneId) => void;
  onStartWorldLevel: (worldId: number, level: number) => void;
  onStartDailyAdventure: () => void;
  onToggleEffects: () => void;
  onToggleReadAloud: () => void;
}

const WorldDiorama: React.FC<{ worldId: number }> = ({ worldId }) => {
  if (worldId === 1) {
    return (
      <svg viewBox="0 0 120 64" className="w-full h-12 sm:h-14 md:h-16 short:h-8">
        <rect x="12" y="14" width="96" height="42" rx="10" fill="#1D4ED8" />
        <rect x="12" y="8" width="96" height="40" rx="10" fill="#3B82F6" />
        <rect x="20" y="14" width="22" height="12" rx="4" fill="#93C5FD" />
        <rect x="48" y="14" width="22" height="12" rx="4" fill="#FDE047" />
        <rect x="76" y="14" width="22" height="12" rx="4" fill="#93C5FD" />
        <rect x="20" y="30" width="22" height="12" rx="4" fill="#60A5FA" />
        <rect x="48" y="30" width="22" height="12" rx="4" fill="#34D399" />
        <rect x="76" y="30" width="22" height="12" rx="4" fill="#FB7185" />
      </svg>
    );
  }
  if (worldId === 2) {
    return (
      <svg viewBox="0 0 120 64" className="w-full h-12 sm:h-14 md:h-16 short:h-8">
        <rect x="8" y="42" width="104" height="14" rx="6" fill="#0EA5E9" />
        <rect x="14" y="20" width="20" height="28" rx="5" fill="#10B981" />
        <rect x="86" y="20" width="20" height="28" rx="5" fill="#10B981" />
        <rect x="24" y="18" width="72" height="12" rx="5" fill="#D97706" />
        <rect x="34" y="12" width="12" height="8" rx="3" fill="#F59E0B" />
        <rect x="54" y="12" width="12" height="8" rx="3" fill="#F59E0B" />
        <rect x="74" y="12" width="12" height="8" rx="3" fill="#F59E0B" />
      </svg>
    );
  }
  if (worldId === 3) {
    return (
      <svg viewBox="0 0 120 64" className="w-full h-12 sm:h-14 md:h-16 short:h-8">
        <rect x="12" y="38" width="32" height="18" rx="5" fill="#F59E0B" />
        <rect x="42" y="26" width="32" height="30" rx="5" fill="#EA580C" />
        <rect x="72" y="14" width="36" height="42" rx="5" fill="#D97706" />
        <rect x="88" y="2" width="4" height="14" fill="#334155" />
        <polygon points="92,2 108,7 92,12" fill="#E11D48" />
      </svg>
    );
  }
  if (worldId === 4) {
    return (
      <svg viewBox="0 0 120 64" className="w-full h-12 sm:h-14 md:h-16 short:h-8">
        <rect x="16" y="14" width="38" height="36" rx="8" fill="#059669" />
        <rect x="66" y="14" width="38" height="36" rx="8" fill="#10B981" />
        <rect x="32" y="23" width="6" height="18" rx="2" fill="#FFFFFF" />
        <rect x="25" y="29" width="20" height="6" rx="2" fill="#FFFFFF" />
        <rect x="75" y="29" width="20" height="6" rx="2" fill="#FFFFFF" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 64" className="w-full h-12 sm:h-14 md:h-16 short:h-8">
      <rect x="22" y="40" width="24" height="16" rx="4" fill="#8B5CF6" />
      <rect x="48" y="40" width="24" height="16" rx="4" fill="#7C3AED" />
      <rect x="74" y="40" width="24" height="16" rx="4" fill="#8B5CF6" />
      <rect x="35" y="24" width="24" height="16" rx="4" fill="#A78BFA" />
      <rect x="61" y="24" width="24" height="16" rx="4" fill="#7C3AED" />
      <rect x="48" y="8" width="24" height="16" rx="4" fill="#6D28D9" />
    </svg>
  );
};

export const HomeMapScene: React.FC<HomeMapSceneProps> = ({
  state,
  activePatterns,
  onNavigate,
  onStartWorldLevel,
  onStartDailyAdventure,
  onToggleEffects,
  onToggleReadAloud,
}) => {
  const profile = state.profile!;
  const [mood, setMood] = useState<MascotMood>('idle');
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);
  const [pickerWorldId, setPickerWorldId] = useState<number | null>(null);

  const greeting = useMemo(() => {
    const rng = createRng(`${profile.animalName}_${new Date().toDateString()}`);
    return rng.pick(STRINGS_DE.map.greetingVariants)(profile.animalName);
  }, [profile.animalName]);

  const fleissbaum = useMemo(
    () => calculateFleissbaumProgress(profile.activeDays),
    [profile.activeDays]
  );

  const world1Progress = state.worldProgress[1] ?? { unlockedLevel: 1, starsByLevel: {} };

  const handleMascotTap = () => {
    soundEngine.playHopTone(4);
    setMood('happy');
    setTimeout(() => setMood('idle'), 1400);
  };

  const startParentHold = () => {
    const started = Date.now();
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - started;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(pct);
      if (elapsed >= 3000) {
        stopParentHold();
        onNavigate('parent');
      }
    }, 80);
  };

  const stopParentHold = () => {
    if (holdTimerRef.current !== null) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const pickerProgress = pickerWorldId
    ? (state.worldProgress[pickerWorldId] ?? { unlockedLevel: 1, starsByLevel: {} })
    : null;

  return (
    <div className="h-dvh overflow-hidden relative flex flex-col">
      <WorldBackdrop worldId={0} scrimClass="bg-white/22" />

      <div className="relative z-10 max-w-6xl w-full flex-1 min-h-0 mx-auto p-2.5 sm:p-4 short:p-2 flex flex-col gap-2.5 short:gap-1.5">
        {/* Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-2 bg-white/95 rounded-2xl border-2 border-sky-200 px-3 sm:px-4 py-1.5 short:py-1 shadow-[0_3px_0_#BAE6FD] shrink-0">
          <div className="flex items-center gap-2 text-base sm:text-lg short:text-sm font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
            <span className="inline-block w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm bg-blue-600" aria-hidden="true" />
            <span>{STRINGS_DE.app.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm short:text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 tabular-nums text-amber-700">
              <span className="inline-block w-3 h-3 rounded-xs bg-amber-400 border border-amber-600" aria-hidden="true" />
              {profile.coins} Goldklötzchen
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-emerald-800" title="Dein Fleißbaum wächst mit jedem aktiven Tag!">
              <Trees className="w-4 h-4 text-emerald-600" />
              <span>{fleissbaum.daysCount} {fleissbaum.daysCount === 1 ? 'Tag' : 'Tage'}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300 hidden md:inline">·</span>
            <span className="text-slate-800 hidden md:inline">{profile.animalName}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />
            <FullscreenButton />
            <button
              type="button"
              onClick={onToggleReadAloud}
              aria-label={state.settings.readAloud ? 'Vorlesen ausschalten' : 'Vorlesen einschalten'}
              title={state.settings.readAloud ? 'Vorlesen: An (Tippen zum Ausschalten)' : 'Vorlesen: Aus (Tippen zum Einschalten)'}
              className={`min-h-[40px] sm:min-h-[44px] short:min-h-[36px] px-2.5 sm:px-3 rounded-xl border-2 flex items-center justify-center gap-1 text-xs font-bold ${
                state.settings.readAloud
                  ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                  : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {state.settings.readAloud ? (
                <Megaphone className="w-4 h-4 shrink-0" />
              ) : (
                <MegaphoneOff className="w-4 h-4 shrink-0" />
              )}
              <span className="hidden lg:inline">
                {state.settings.readAloud ? 'Vorlesen' : 'Vorlesen aus'}
              </span>
            </button>
            <button
              type="button"
              onClick={onToggleEffects}
              aria-label="Ton an oder aus"
              title={state.settings.effectsEnabled ? 'Töne: An' : 'Töne: Aus'}
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] short:min-h-[36px] short:min-w-[36px] rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700"
            >
              {state.settings.effectsEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </header>

        {/* Scroll-safe Middle Area (fits 100% without scroll on tablet/desktop & 915x412 landscape; scrolls safely on tiny screens) */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2.5 short:gap-1.5">
          {/* Mascot Stage on Grassy Klötzchen Pedestal */}
          <section className="bg-white/95 rounded-2xl sm:rounded-3xl border-2 border-emerald-300 px-3.5 py-2.5 sm:px-6 sm:py-4 short:px-3.5 short:py-1.5 shadow-[0_4px_0_#86EFAC] grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-2.5 sm:gap-4 short:gap-2.5 shrink-0">
            <div className="hidden sm:flex short:hidden flex-col items-center justify-center px-3 py-1 rounded-2xl bg-gradient-to-b from-sky-50 to-emerald-100 border-2 border-emerald-200">
              <Mascot
                animal={profile.animal}
                mood={mood}
                size={84}
                reducedMotion={state.settings.reducedMotion}
                equipped={state.equippedAccessories}
                onClick={handleMascotTap}
              />
              <div className="w-20 h-2.5 rounded-lg bg-emerald-500 border-b-2 border-emerald-700 -mt-1" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="inline-block rounded-xl sm:rounded-2xl bg-amber-50 border-2 border-amber-200 px-3 py-1.5 short:px-2.5 short:py-1">
                <h1 className="text-base sm:text-xl short:text-sm font-extrabold text-slate-900 text-balance leading-snug">
                  {greeting}
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 short:hidden">{STRINGS_DE.map.placeValueLegend}</p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 short:gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSuccessChime();
                  onStartWorldLevel(1, world1Progress.unlockedLevel);
                }}
                className="min-h-[48px] sm:min-h-[54px] short:min-h-[40px] px-4 sm:px-6 short:px-4 py-2 short:py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base short:text-xs shadow-[0_4px_0_#047857] active:translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bauplatte Level {world1Progress.unlockedLevel}</span>
              </button>

              {activePatterns.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playBlockTap();
                    onNavigate('practice');
                  }}
                  className="min-h-[42px] short:min-h-[36px] px-3.5 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 text-amber-950 font-extrabold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Übungsinsel für dich</span>
                </button>
              )}
            </div>
          </section>

          {/* Illustrated 5-Worlds Adventure Path */}
          <section className="shrink-0 flex flex-col gap-2 short:gap-1">
            <div className="flex items-center justify-between gap-2 px-1 shrink-0">
              <h2 className="text-sm sm:text-lg short:text-xs font-extrabold text-slate-900">{STRINGS_DE.map.worldsHeading}</h2>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playBlockTap();
                  onNavigate('training');
                }}
                className="text-xs sm:text-sm short:text-xs font-bold text-blue-800 hover:underline px-2 py-0.5"
              >
                Schreibtraining wiederholen
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 short:gap-2">
              {APP_CONFIG.worlds.map((world) => {
                const label = STRINGS_DE.worlds[world.id];
                const progress = state.worldProgress[world.id];
                const isEnabled = state.settings.enabledWorlds.includes(world.id);
                const earnedStars = Object.values(progress?.starsByLevel ?? {}).reduce((a, b) => a + b, 0);

                return (
                  <button
                    key={world.id}
                    type="button"
                    disabled={!isEnabled}
                    onClick={() => {
                      soundEngine.playBlockTap();
                      setPickerWorldId(world.id);
                    }}
                    className={`rounded-2xl sm:rounded-3xl border-2 p-2.5 sm:p-3 short:p-2 text-left flex flex-col justify-between gap-1.5 short:gap-1 transition-all ${
                      isEnabled
                        ? 'bg-white hover:-translate-y-0.5 cursor-pointer'
                        : 'border-slate-200 bg-white/75 opacity-60 cursor-not-allowed'
                    }`}
                    style={
                      isEnabled
                        ? {
                            borderColor: world.accentHex,
                            boxShadow: `0 4px 0 ${world.accentHex}`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className="w-6 h-6 sm:w-7 sm:h-7 short:w-5 short:h-5 rounded-lg flex items-center justify-center text-white font-extrabold text-xs sm:text-sm short:text-[11px]"
                        style={{ backgroundColor: world.accentHex }}
                      >
                        {world.id}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-700 tabular-nums">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {earnedStars}/{world.levelsCount * 3}
                      </span>
                    </div>

                    <div className="rounded-xl p-1 sm:p-1.5 short:p-1 border border-slate-100" style={{ backgroundColor: world.surfaceHex }}>
                      <WorldDiorama worldId={world.id} />
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm md:text-base short:text-xs font-extrabold text-slate-900 leading-tight truncate">
                        {label.name}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 mt-0.5 hidden md:block short:hidden">
                        {label.subtitle}
                      </p>
                      <p className="text-[11px] short:text-[10px] font-bold mt-0.5" style={{ color: world.accentHex }}>
                        {isEnabled ? `Level ${progress?.unlockedLevel ?? 1}/${world.levelsCount}` : 'Pausiert'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom Action Dock */}
        <section className="flex flex-wrap items-center justify-between gap-2 short:gap-1.5 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 short:gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccessChime();
                onStartDailyAdventure();
              }}
              className="min-h-[44px] sm:min-h-[52px] short:min-h-[38px] px-3 sm:px-4 short:px-2.5 py-1.5 rounded-2xl border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 font-extrabold text-xs sm:text-sm short:text-xs shadow-[0_3px_0_#F59E0B] flex items-center gap-1.5 whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-amber-600" />
              <span>{STRINGS_DE.map.dailyAdventureTitle}</span>
            </button>

            {[
              { id: 'hub' as SceneId, label: STRINGS_DE.map.hubButton, icon: Hammer, color: 'text-emerald-600' },
              { id: 'album' as SceneId, label: STRINGS_DE.map.albumButton, icon: BookOpen, color: 'text-purple-600' },
              { id: 'shop' as SceneId, label: STRINGS_DE.map.shopButton, icon: ShoppingBag, color: 'text-rose-600' },
              { id: 'testbed' as SceneId, label: STRINGS_DE.map.testbedButton, icon: FlaskConical, color: 'text-blue-600' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playBlockTap();
                    onNavigate(item.id);
                  }}
                  className="min-h-[44px] sm:min-h-[52px] short:min-h-[38px] px-3 sm:px-4 short:px-2.5 py-1.5 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm short:text-xs shadow-[0_3px_0_#CBD5E1] flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onPointerDown={startParentHold}
            onPointerUp={stopParentHold}
            onPointerLeave={stopParentHold}
            onPointerCancel={stopParentHold}
            className="relative min-h-[42px] sm:min-h-[46px] short:min-h-[38px] px-3 sm:px-4 py-1.5 rounded-xl border-2 border-slate-300 bg-white/95 text-slate-600 text-xs font-bold flex items-center gap-1.5 overflow-hidden select-none whitespace-nowrap"
          >
            {holdProgress > 0 && (
              <span
                className="absolute inset-y-0 left-0 bg-blue-200/70 transition-all"
                style={{ width: `${holdProgress}%` }}
              />
            )}
            <Lock className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{STRINGS_DE.map.parentHoldHint}</span>
          </button>
        </section>
      </div>

      {/* Level Picker Modal for Worlds 1..5 */}
      {pickerWorldId !== null && pickerProgress && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs overflow-y-auto flex flex-col p-3 sm:p-4"
        >
          <div className="my-auto mx-auto w-full max-w-xl rounded-3xl bg-white border-2 border-slate-200 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {STRINGS_DE.worlds[pickerWorldId]?.name} · Wähle dein Level
              </h2>
              <button
                type="button"
                onClick={() => setPickerWorldId(null)}
                aria-label={STRINGS_DE.app.close}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => {
                const unlocked = lvl <= pickerProgress.unlockedLevel;
                const stars = pickerProgress.starsByLevel[lvl] ?? 0;
                return (
                  <button
                    key={lvl}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      soundEngine.playSuccessChime();
                      const wId = pickerWorldId;
                      setPickerWorldId(null);
                      onStartWorldLevel(wId, lvl);
                    }}
                    className={`min-h-[72px] sm:min-h-[82px] rounded-2xl border-2 p-2.5 flex flex-col items-center justify-center gap-1 transition-all ${
                      unlocked
                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-950 shadow-[0_4px_0_#2563EB]'
                        : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-extrabold tabular-nums">Level {lvl}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findCatalogItem } from './content/catalog';
import { soundEngine } from './core/audio';
import { stopSpeech } from './core/speech';
import {
  appendTaskLog,
  clearLearnedTemplates,
  createDefaultState,
  exportBackupBundle,
  importBackupBundle,
  loadAppState,
  loadLearnedTemplates,
  loadTaskLogs,
  requestPersistentStorage,
  resetAllStorage,
  saveAppState,
  saveLearnedTemplate,
} from './core/storage';
import type {
  AnimalType,
  AppStateV1,
  DigitTemplate,
  GameSettings,
  SceneId,
  TaskLogEntry,
} from './core/types';
import { detectActiveErrorPatterns } from './diagnostics/patterns';
import { HandwritingTestbed } from './input/HandwritingTestbed';
import { WritingTrainer } from './input/WritingTrainer';
import { applySkillUpdate } from './rewards/adaptive';
import { openChestWithProtection, type ChestRewardOutcome } from './rewards/chests';
import {
  applyCoinDelta,
  getChestTierForStars,
  getTodayIso,
  isDailyAdventureCompletedToday,
  purchaseCatalogItem,
} from './rewards/economy';
import { generateDailyAdventureTasks } from './tasks/dailyAdventure';
import type { MathTask } from './tasks/types';
import { AlbumScene } from './ui/AlbumScene';
import { ChestScene } from './ui/ChestScene';
import { OfflineIndicator } from './ui/DesignSystem';
import { HomeMapScene } from './ui/HomeMapScene';
import { HubScene } from './ui/HubScene';
import { LevelScene } from './ui/LevelScene';
import { MinigamesScene } from './ui/MinigamesScene';
import { ParentScene } from './ui/ParentScene';
import { PracticeScene } from './ui/PracticeScene';
import { ShopScene } from './ui/ShopScene';
import { WelcomeScene } from './ui/WelcomeScene';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode; onRecover?: () => void }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Klötzchen-Abenteuer Fehler:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh overflow-y-auto bg-[#F4F6F9] p-4 flex flex-col">
          <div className="my-auto mx-auto w-full max-w-md rounded-3xl bg-white border-2 border-amber-300 p-6 shadow-lg text-center space-y-4">
            <h1 className="text-xl font-extrabold text-slate-900">Hoppla! Ein Baustein ist verrutscht.</h1>
            <p className="text-sm text-slate-600">
              Kein Problem – deine Sterne, Münzen und Sticker sind sicher gespeichert!
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onRecover?.();
              }}
              className="w-full min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-[0_4px_0_#047857]"
            >
              Zurück zur Abenteuerkarte
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [state, setState] = useState<AppStateV1 | null>(null);
  const [learnedTemplates, setLearnedTemplates] = useState<DigitTemplate[]>([]);
  const [logs, setLogs] = useState<TaskLogEntry[]>([]);
  const [scene, setScene] = useState<SceneId>('welcome');
  const [activeWorld, setActiveWorld] = useState(1);
  const [activeLevel, setActiveLevel] = useState(1);
  const [isDailyAdventure, setIsDailyAdventure] = useState(false);
  const [dailyTasks, setDailyTasks] = useState<MathTask[]>([]);
  const [pendingChestOutcome, setPendingChestOutcome] = useState<ChestRewardOutcome | null>(null);
  const [activeMinigameId, setActiveMinigameId] = useState<string | null>(null);
  const [shopInitialTab, setShopInitialTab] = useState<string | undefined>(undefined);
  const [sessionStartedAt] = useState<number>(() => Date.now());
  const lastPlayTickRef = useRef<number>(Date.now());

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        void requestPersistentStorage();
        const [loadedState, templates, loadedLogs] = await Promise.all([
          loadAppState(),
          loadLearnedTemplates(),
          loadTaskLogs(),
        ]);
        if (!mounted) return;

        // Ensure today's active day is tracked on launch when profile exists
        const today = getTodayIso();
        let finalState = loadedState;
        if (loadedState.profile && !loadedState.profile.activeDays.includes(today)) {
          finalState = {
            ...loadedState,
            profile: {
              ...loadedState.profile,
              activeDays: [...loadedState.profile.activeDays, today],
            },
          };
          void saveAppState(finalState).catch(() => {});
        }

        soundEngine.setEffectsEnabled(finalState.settings.effectsEnabled);
        setState(finalState);
        setLearnedTemplates(templates);
        setLogs(loadedLogs);
        if (finalState.profile) {
          setScene(finalState.profile.trainingCompleted ? 'map' : 'training');
        } else {
          setScene('welcome');
        }
      } catch {
        if (!mounted) return;
        const fallback = createDefaultState();
        setState(fallback);
        setScene('welcome');
      }
    }
    void init();
    return () => {
      mounted = false;
    };
  }, []);

  const updateState = useCallback((updater: (prev: AppStateV1) => AppStateV1) => {
    setState((prev) => {
      const base = prev ?? createDefaultState();
      const next = updater(base);
      soundEngine.setEffectsEnabled(next.settings.effectsEnabled);
      void saveAppState(next).catch(() => {});
      return next;
    });
  }, []);

  // Track active playtime locally for Parent Dashboard
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.min(60000, Math.max(0, now - lastPlayTickRef.current));
      lastPlayTickRef.current = now;
      if (delta <= 0) return;
      const today = getTodayIso();
      setState((prev) => {
        if (!prev?.profile) return prev;
        const next: AppStateV1 = {
          ...prev,
          playtimeByDate: {
            ...prev.playtimeByDate,
            [today]: (prev.playtimeByDate[today] ?? 0) + delta,
          },
        };
        void saveAppState(next).catch(() => {});
        return next;
      });
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const activePatterns = useMemo(() => detectActiveErrorPatterns(logs), [logs]);

  const handleSaveTemplate = async (tpl: DigitTemplate) => {
    try {
      const updated = await saveLearnedTemplate(tpl);
      setLearnedTemplates(updated);
    } catch {
      setLearnedTemplates((prev) => [...prev, tpl]);
    }
  };

  const handleLogTask = async (entry: TaskLogEntry) => {
    setLogs((prev) => [...prev, entry]);
    try {
      await appendTaskLog(entry);
    } catch {
      // Keep in-memory log even if IDB write fails
    }
  };

  if (!state) {
    return (
      <div className="h-dvh overflow-hidden bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-lg font-bold text-slate-600">Klötzchen werden geladen …</div>
      </div>
    );
  }

  const handleWelcomeComplete = (animal: AnimalType, animalName: string, startTraining: boolean) => {
    const today = getTodayIso();
    updateState((prev) => ({
      ...prev,
      profile: {
        animal,
        animalName,
        trainingCompleted: !startTraining,
        coins: 0,
        activeDays: [today],
        createdAt: Date.now(),
      },
    }));
    setScene(startTraining ? 'training' : 'map');
  };

  const handleTrainingFinish = () => {
    updateState((prev) => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, trainingCompleted: true } : null,
    }));
    setScene('map');
  };

  const handleStartWorldLevel = (worldId: number, lvl: number) => {
    setIsDailyAdventure(false);
    setDailyTasks([]);
    setActiveWorld(worldId);
    setActiveLevel(lvl);
    setScene('level');
  };

  const handleStartDailyAdventure = () => {
    const today = getTodayIso();
    const mixed = generateDailyAdventureTasks(state, logs, today);
    setIsDailyAdventure(true);
    setDailyTasks(mixed);
    setActiveWorld(mixed[0]?.world ?? 1);
    setActiveLevel(1);
    setScene('level');
  };

  const handleSkillOutcome = (skill: string, wasCleanFirstTry: boolean) => {
    updateState((prev) => applySkillUpdate(prev, skill, wasCleanFirstTry));
  };

  const handleLevelComplete = (
    worldId: number,
    level: number,
    stars: number,
    coinsEarned: number,
    daily: boolean
  ) => {
    const today = getTodayIso();
    updateState((prev) => {
      const nextCoins = applyCoinDelta(prev.profile?.coins ?? 0, coinsEarned);
      const activeDays = prev.profile
        ? prev.profile.activeDays.includes(today)
          ? prev.profile.activeDays
          : [...prev.profile.activeDays, today]
        : [today];

      if (daily) {
        return {
          ...prev,
          dailyAdventureDate: today,
          profile: prev.profile ? { ...prev.profile, coins: nextCoins, activeDays } : null,
        };
      }

      const wp = prev.worldProgress[worldId] ?? { unlockedLevel: 1, starsByLevel: {} };
      const prevStars = wp.starsByLevel[level] ?? 0;
      const nextUnlocked = Math.min(8, Math.max(wp.unlockedLevel, level + 1));
      return {
        ...prev,
        profile: prev.profile ? { ...prev.profile, coins: nextCoins, activeDays } : null,
        worldProgress: {
          ...prev.worldProgress,
          [worldId]: {
            unlockedLevel: nextUnlocked,
            starsByLevel: {
              ...wp.starsByLevel,
              [level]: Math.max(prevStars, stars),
            },
          },
        },
      };
    });
  };

  const handleOpenChest = (stars: number) => {
    const tier = getChestTierForStars(stars);
    const { outcome, nextState } = openChestWithProtection(state, tier);
    soundEngine.setEffectsEnabled(nextState.settings.effectsEnabled);
    setState(nextState);
    void saveAppState(nextState);
    setPendingChestOutcome(outcome);
    setScene('chest');
  };

  const handlePlaceHubItem = (itemId: string, x: number, y: number) => {
    const catalogItem = findCatalogItem(itemId);
    if (!catalogItem) return;
    updateState((prev) => {
      const others = prev.hubPlacements.filter((p) => !(p.x === x && p.y === y));
      const stack = prev.hubPlacements
        .filter((p) => p.x === x && p.y === y)
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

      const blocks = stack.filter((p) => findCatalogItem(p.itemId)?.category === 'baustein');
      const topper = stack.find((p) => findCatalogItem(p.itemId)?.category !== 'baustein');

      if (catalogItem.category === 'baustein') {
        const nextBlocks =
          blocks.length < 4
            ? [...blocks, { itemId, x, y, z: blocks.length, rotation: 0 }]
            : [...blocks.slice(0, 3), { itemId, x, y, z: 3, rotation: 0 }];
        const normalizedBlocks = nextBlocks.map((b, idx) => ({ ...b, z: idx }));
        const nextStack = topper
          ? [...normalizedBlocks, { ...topper, z: normalizedBlocks.length }]
          : normalizedBlocks;
        return {
          ...prev,
          hubPlacements: [...others, ...nextStack],
        };
      }

      // Non-block item (plant, animal, building, vehicle, deco) sits neatly atop existing blocks
      const normalizedBlocks = blocks.map((b, idx) => ({ ...b, z: idx }));
      return {
        ...prev,
        hubPlacements: [
          ...others,
          ...normalizedBlocks,
          { itemId, x, y, z: normalizedBlocks.length, rotation: 0 },
        ],
      };
    });
  };

  const handleRotateHubAt = (x: number, y: number) => {
    updateState((prev) => {
      const stack = prev.hubPlacements
        .filter((p) => p.x === x && p.y === y)
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
      if (stack.length === 0) return prev;
      const topZ = stack[stack.length - 1].z ?? stack.length - 1;
      return {
        ...prev,
        hubPlacements: prev.hubPlacements.map((p) =>
          p.x === x && p.y === y && (p.z ?? 0) === topZ
            ? { ...p, rotation: (p.rotation + 1) % 2 }
            : p
        ),
      };
    });
  };

  const handleRemoveHubAt = (x: number, y: number) => {
    updateState((prev) => {
      const stack = prev.hubPlacements
        .filter((p) => p.x === x && p.y === y)
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
      if (stack.length === 0) return prev;
      const remainingAtTile = stack.slice(0, -1).map((p, idx) => ({ ...p, z: idx }));
      const others = prev.hubPlacements.filter((p) => !(p.x === x && p.y === y));
      return {
        ...prev,
        hubPlacements: [...others, ...remainingAtTile],
      };
    });
  };

  const handleClaimBuildQuest = (questId: string, rewardCoins: number) => {
    updateState((prev) => {
      const completed = prev.completedBuildQuests ?? [];
      if (completed.includes(questId)) return prev;
      return {
        ...prev,
        completedBuildQuests: [...completed, questId],
        profile: prev.profile
          ? { ...prev.profile, coins: applyCoinDelta(prev.profile.coins, rewardCoins) }
          : null,
      };
    });
  };

  const handleBuyShopItem = (itemId: string) => {
    updateState((prev) => purchaseCatalogItem(prev, itemId).state);
  };

  const handleToggleWishlist = (itemId: string) => {
    updateState((prev) => ({
      ...prev,
      wishlistItemId: prev.wishlistItemId === itemId ? null : itemId,
    }));
  };

  const handleEquipAccessory = (
    slot: 'hat' | 'cape' | 'backpack' | 'hopEffect',
    itemId: string | null
  ) => {
    updateState((prev) => ({
      ...prev,
      equippedAccessories: {
        ...prev.equippedAccessories,
        [slot]: itemId,
      },
    }));
  };

  const handleUpdateSettings = (patch: Partial<GameSettings>) => {
    if (patch.readAloud === false) {
      stopSpeech();
    }
    updateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
      },
    }));
  };

  const handleToggleReadAloud = () => {
    updateState((prev) => {
      const nextRead = !prev.settings.readAloud;
      if (!nextRead) {
        stopSpeech();
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          readAloud: nextRead,
        },
      };
    });
  };

  return (
    <AppErrorBoundary onRecover={() => setScene(state.profile ? 'map' : 'welcome')}>
      {scene === 'welcome' && (
        <WelcomeScene onComplete={handleWelcomeComplete} />
      )}

      {scene === 'training' && state.profile && (
        <WritingTrainer
          animal={state.profile.animal}
          animalName={state.profile.animalName}
          reducedMotion={state.settings.reducedMotion}
          leftHanded={state.settings.leftHanded}
          onSaveTemplate={handleSaveTemplate}
          onComplete={handleTrainingFinish}
          onSkip={handleTrainingFinish}
        />
      )}

      {scene === 'map' && state.profile && (
        <HomeMapScene
          state={state}
          activePatterns={activePatterns}
          onNavigate={setScene}
          onStartWorldLevel={handleStartWorldLevel}
          onStartDailyAdventure={handleStartDailyAdventure}
          onToggleEffects={() =>
            updateState((prev) => ({
              ...prev,
              settings: { ...prev.settings, effectsEnabled: !prev.settings.effectsEnabled },
            }))
          }
          onToggleReadAloud={handleToggleReadAloud}
        />
      )}

      {scene === 'level' && state.profile && (
        <LevelScene
          key={isDailyAdventure ? `daily_${dailyTasks[0]?.id ?? 'run'}` : `w${activeWorld}_l${activeLevel}`}
          state={state}
          worldId={activeWorld}
          level={activeLevel}
          isDailyAdventure={isDailyAdventure}
          dailyTasks={dailyTasks}
          sessionStartedAt={sessionStartedAt}
          learnedTemplates={learnedTemplates}
          onSaveLearnedTemplate={handleSaveTemplate}
          onLogTask={handleLogTask}
          onSkillOutcome={handleSkillOutcome}
          onLevelComplete={handleLevelComplete}
          onOpenChest={handleOpenChest}
          onNextLevel={(nextLvl) => setActiveLevel(nextLvl)}
          onToggleReadAloud={handleToggleReadAloud}
          onBackToMap={() => setScene('map')}
        />
      )}

      {scene === 'chest' && pendingChestOutcome && (
        <ChestScene
          animal={state.profile?.animal ?? 'fuchs'}
          equipped={state.equippedAccessories}
          outcome={pendingChestOutcome}
          reducedMotion={state.settings.reducedMotion}
          onContinue={() => {
            setPendingChestOutcome(null);
            setScene(state.profile ? 'map' : 'welcome');
          }}
        />
      )}

      {scene === 'hub' && state.profile && (
        <HubScene
          state={state}
          onPlaceItem={handlePlaceHubItem}
          onRotateAt={handleRotateHubAt}
          onRemoveAt={handleRemoveHubAt}
          onClaimQuest={handleClaimBuildQuest}
          onOpenShop={() => {
            setShopInitialTab(undefined);
            setScene('shop');
          }}
          onBack={() => setScene('map')}
        />
      )}

      {scene === 'shop' && state.profile && (
        <ShopScene
          key={shopInitialTab ?? 'default'}
          state={state}
          dailyDone={isDailyAdventureCompletedToday(state.dailyAdventureDate)}
          initialTabId={shopInitialTab}
          onBuyItem={handleBuyShopItem}
          onToggleWishlist={handleToggleWishlist}
          onEquipAccessory={handleEquipAccessory}
          onPlayMinigame={(catalogItemId) => {
            setActiveMinigameId(catalogItemId);
            setScene('minigames');
          }}
          onBack={() => {
            setShopInitialTab(undefined);
            setScene('map');
          }}
        />
      )}

      {scene === 'minigames' && state.profile && (
        <MinigamesScene
          state={state}
          dailyDone={isDailyAdventureCompletedToday(state.dailyAdventureDate)}
          initialGameId={activeMinigameId}
          onBuyItem={handleBuyShopItem}
          onStartDailyAdventure={handleStartDailyAdventure}
          onOpenShop={() => {
            setShopInitialTab('spiele');
            setScene('shop');
          }}
          onBack={() => setScene('map')}
        />
      )}

      {scene === 'album' && state.profile && (
        <AlbumScene
          state={state}
          onSelectActiveSeries={(seriesId) =>
            updateState((prev) => ({ ...prev, activeSeriesId: seriesId }))
          }
          onSelectActivePuzzle={(puzzleId) =>
            updateState((prev) => ({ ...prev, activePuzzleId: puzzleId }))
          }
          onToggleReadAloud={handleToggleReadAloud}
          onBack={() => setScene('map')}
        />
      )}

      {scene === 'practice' && state.profile && (
        <PracticeScene
          state={state}
          patterns={activePatterns}
          learnedTemplates={learnedTemplates}
          onSaveLearnedTemplate={handleSaveTemplate}
          onLogTask={handleLogTask}
          onRewardCoins={(coins) =>
            updateState((prev) => ({
              ...prev,
              profile: prev.profile
                ? { ...prev.profile, coins: applyCoinDelta(prev.profile.coins, coins) }
                : null,
            }))
          }
          onToggleReadAloud={handleToggleReadAloud}
          onBack={() => setScene('map')}
        />
      )}

      {scene === 'parent' && (
        <ParentScene
          state={state}
          logs={logs}
          learnedCount={learnedTemplates.length}
          onUpdateSettings={handleUpdateSettings}
          onExportBackup={async () => JSON.stringify(await exportBackupBundle(), null, 2)}
          onImportBackup={async (jsonText) => {
            const parsed = JSON.parse(jsonText) as unknown;
            const restored = await importBackupBundle(parsed);
            const [tpls, lgs] = await Promise.all([loadLearnedTemplates(), loadTaskLogs()]);
            setState(restored);
            setLearnedTemplates(tpls);
            setLogs(lgs);
            soundEngine.setEffectsEnabled(restored.settings.effectsEnabled);
          }}
          onResetTraining={async () => {
            await clearLearnedTemplates();
            setLearnedTemplates([]);
          }}
          onFullReset={async () => {
            const fresh = await resetAllStorage();
            setState(fresh);
            setLearnedTemplates([]);
            setLogs([]);
            setScene('welcome');
          }}
          onOpenTestbed={() => setScene('testbed')}
          onOpenPractice={() => setScene('practice')}
          onBack={() => setScene(state.profile ? 'map' : 'welcome')}
        />
      )}

      {scene === 'testbed' && (
        <HandwritingTestbed
          learnedTemplates={learnedTemplates}
          onSaveTemplate={handleSaveTemplate}
          leftHanded={state.settings.leftHanded}
          reducedMotion={state.settings.reducedMotion}
          onToggleLeftHanded={(val) => handleUpdateSettings({ leftHanded: val })}
          onToggleReducedMotion={(val) => handleUpdateSettings({ reducedMotion: val })}
          onBack={() => setScene(state.profile ? 'map' : 'welcome')}
        />
      )}

      <OfflineIndicator />
    </AppErrorBoundary>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Compass, Eye, Heart, HelpCircle, Megaphone, MegaphoneOff, PackageOpen, RotateCcw, Star, Volume2 } from 'lucide-react';
import { APP_CONFIG } from '../content/config';
import { STRINGS_DE } from '../content/strings.de';
import { soundEngine } from '../core/audio';
import { createRng } from '../core/rng';
import { numberToGermanWords, speakGerman } from '../core/speech';
import type { AppStateV1, DigitTemplate, ErrorCategoryCode, MascotMood, TaskLogEntry } from '../core/types';
import { DIAGNOSTIC_HINTS } from '../diagnostics/errorModel';
import { NumberInputPad, type NumberConfirmPayload } from '../input/NumberInputPad';
import { evaluateFieldForWorld, generateWorldTasks } from '../tasks/dailyAdventure';
import type { MathTask } from '../tasks/types';
import { buildBoardHopPath, isValidBoardNumber } from '../tasks/world1Hundertertafel';
import { FullscreenButton } from './DesignSystem';
import { HundertertafelBoard } from './HundertertafelBoard';
import { Mascot } from './Mascot';
import { RechenwerkstattBoard } from './RechenwerkstattBoard';
import { ZahlenmauerBoard } from './ZahlenmauerBoard';
import { ZahlenstrahlBoard } from './ZahlenstrahlBoard';
import { ZehneruebergangBoard } from './ZehneruebergangBoard';
import { WorldBackdrop } from './WorldBackdrop';

interface LevelSceneProps {
  state: AppStateV1;
  worldId: number;
  level: number;
  isDailyAdventure?: boolean;
  dailyTasks?: MathTask[];
  sessionStartedAt: number;
  learnedTemplates: DigitTemplate[];
  onSaveLearnedTemplate: (tpl: DigitTemplate) => Promise<void> | void;
  onLogTask: (entry: TaskLogEntry) => Promise<void> | void;
  onSkillOutcome: (skill: string, wasCleanFirstTry: boolean) => void;
  onLevelComplete: (worldId: number, level: number, stars: number, coinsEarned: number, isDaily: boolean) => void;
  onOpenChest: (stars: number) => void;
  onNextLevel: (nextLevel: number) => void;
  onToggleReadAloud: () => void;
  onBackToMap: () => void;
}

export const LevelScene: React.FC<LevelSceneProps> = ({
  state,
  worldId,
  level,
  isDailyAdventure = false,
  dailyTasks,
  sessionStartedAt,
  learnedTemplates,
  onSaveLearnedTemplate,
  onLogTask,
  onSkillOutcome,
  onLevelComplete,
  onOpenChest,
  onNextLevel,
  onToggleReadAloud,
  onBackToMap,
}) => {
  const profile = state.profile;
  const [seedNonce, setSeedNonce] = useState(1);

  const baseTasks = useMemo(() => {
    if (isDailyAdventure && dailyTasks && dailyTasks.length > 0) {
      return dailyTasks;
    }
    return generateWorldTasks(worldId, level, `${profile?.createdAt ?? 1}_${seedNonce}`, state.settings);
  }, [isDailyAdventure, dailyTasks, worldId, level, profile?.createdAt, seedNonce, state.settings]);

  const [taskQueue, setTaskQueue] = useState<MathTask[]>(baseTasks);
  const [taskIdx, setTaskIdx] = useState(0);
  const [hearts, setHearts] = useState(APP_CONFIG.gameplay.maxHearts);
  const [explorerMode, setExplorerMode] = useState(false);

  const [activeFieldIdx, setActiveFieldIdx] = useState(0);
  const [filledAnswers, setFilledAnswers] = useState<Record<string, number>>({});
  const [tapCompleted, setTapCompleted] = useState(false);

  const [attemptsOnTask, setAttemptsOnTask] = useState(0);
  const [heartLostOnTask, setHeartLostOnTask] = useState(false);
  const [helpUsedOnTask, setHelpUsedOnTask] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showDotView, setShowDotView] = useState(false);
  const [copySolutionTarget, setCopySolutionTarget] = useState<number | null>(null);

  const [totalWrongAttempts, setTotalWrongAttempts] = useState(0);
  const [anyHelpUsedInLevel, setAnyHelpUsedInLevel] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [levelDone, setLevelDone] = useState<{ stars: number; coins: number } | null>(null);

  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [mascotPos, setMascotPos] = useState<number | null>(null);
  const [trailPositions, setTrailPositions] = useState<number[]>([]);
  const [carryHopStep, setCarryHopStep] = useState(0);
  const [tierMessage, setTierMessage] = useState<string | null>(null);
  const [landingBadge, setLandingBadge] = useState<{ number: number; word: string } | null>(null);
  const [isHopping, setIsHopping] = useState(false);
  const [padResetKey, setPadResetKey] = useState(0);
  const [pauseDismissed, setPauseDismissed] = useState(false);
  const [showPauseHint, setShowPauseHint] = useState(false);

  const taskStartRef = useRef<number>(Date.now());
  const firstStrokeRef = useRef<number | null>(null);
  const hopTimersRef = useRef<number[]>([]);
  const skipHopRef = useRef<(() => void) | null>(null);

  const currentTask = taskQueue[taskIdx];
  const activeField = currentTask?.fields[activeFieldIdx] ?? currentTask?.fields[0];

  const clearHopTimers = useCallback(() => {
    for (const id of hopTimersRef.current) {
      clearTimeout(id);
    }
    hopTimersRef.current = [];
  }, []);

  // O6 Pause reminder check
  useEffect(() => {
    if (pauseDismissed) return;
    const limitMs = state.settings.pauseReminderMinutes * 60 * 1000;
    const check = () => {
      if (Date.now() - sessionStartedAt >= limitMs) {
        setShowPauseHint(true);
      }
    };
    check();
    const id = window.setInterval(check, 15000);
    return () => clearInterval(id);
  }, [sessionStartedAt, state.settings.pauseReminderMinutes, pauseDismissed]);

  useEffect(() => {
    setTaskQueue(baseTasks);
    setTaskIdx(0);
    setHearts(APP_CONFIG.gameplay.maxHearts);
    setExplorerMode(false);
    setTotalWrongAttempts(0);
    setAnyHelpUsedInLevel(false);
    setCoinsEarned(0);
    setLevelDone(null);
  }, [baseTasks]);

  const initializedTaskKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const taskKey = currentTask ? `${taskIdx}_${currentTask.id}` : null;
    if (!currentTask || initializedTaskKeyRef.current === taskKey) return;
    initializedTaskKeyRef.current = taskKey;

    clearHopTimers();
    setActiveFieldIdx(0);
    setFilledAnswers({});
    setTapCompleted(currentTask.inputMode !== 'tap_board_then_number');
    setAttemptsOnTask(0);
    setHeartLostOnTask(false);
    setHelpUsedOnTask(explorerMode);
    setShowHelpPanel(explorerMode);
    setShowDotView(false);
    setCopySolutionTarget(null);
    setMascotMood(showPauseHint && !pauseDismissed ? 'yawn' : 'idle');

    if (currentTask.world === 1) {
      setMascotPos(
        currentTask.inputMode === 'tap_board_then_number'
          ? null
          : (currentTask.boardContext?.startCell ?? null)
      );
    } else if (currentTask.world === 2) {
      setMascotPos(currentTask.numberLineContext?.startMark ?? null);
    } else {
      setMascotPos(null);
    }

    setCarryHopStep(0);
    setTrailPositions([]);
    setTierMessage(null);
    setLandingBadge(null);
    setIsHopping(false);
    setPadResetKey((k) => k + 1);
    taskStartRef.current = Date.now();
    firstStrokeRef.current = null;

    if (state.settings.readAloud) {
      speakGerman(currentTask.spokenPrompt, true);
    }
  }, [taskIdx, currentTask, clearHopTimers, explorerMode, state.settings.readAloud, showPauseHint, pauseDismissed]);

  useEffect(() => {
    return () => clearHopTimers();
  }, [clearHopTimers]);

  const pauseReminderText = useMemo(() => {
    const fn = createRng(sessionStartedAt).pick(STRINGS_DE.feedback.pauseReminders);
    return fn(profile?.animalName ?? 'Fips', state.settings.pauseReminderMinutes);
  }, [sessionStartedAt, profile?.animalName, state.settings.pauseReminderMinutes]);

  const animateHopAlongPath = useCallback(
    (path: number[], onFinish: () => void, finalMood: MascotMood = 'happy') => {
      clearHopTimers();
      if (state.settings.reducedMotion || path.length <= 1) {
        const dest = path[path.length - 1] ?? null;
        setMascotPos(dest);
        setTrailPositions(path);
        setCarryHopStep(2);
        setMascotMood(finalMood);
        setIsHopping(false);
        onFinish();
        return;
      }

      setIsHopping(true);
      setMascotMood('hop');
      const totalBudget = Math.min(APP_CONFIG.gameplay.maxHopDurationMs, Math.max(850, path.length * 260));
      const stepMs = Math.max(120, Math.floor(totalBudget / path.length));

      const completeNow = () => {
        clearHopTimers();
        setMascotPos(path[path.length - 1]);
        setTrailPositions(path);
        setCarryHopStep(2);
        setMascotMood(finalMood);
        setIsHopping(false);
        skipHopRef.current = null;
        onFinish();
      };
      skipHopRef.current = completeNow;

      path.forEach((pos, idx) => {
        const tId = window.setTimeout(() => {
          setMascotPos(pos);
          setTrailPositions(path.slice(0, idx + 1));
          setCarryHopStep(Math.min(2, idx));
          soundEngine.playHopTone(idx);
          if (idx === path.length - 1) {
            setMascotMood(finalMood);
            setIsHopping(false);
            skipHopRef.current = null;
            onFinish();
          }
        }, idx * stepMs);
        hopTimersRef.current.push(tId);
      });
    },
    [clearHopTimers, state.settings.reducedMotion]
  );

  const finishWholeTask = (
    finalCoinsDelta: number,
    categoriesLogged: ErrorCategoryCode[],
    payload: NumberConfirmPayload
  ) => {
    const nextCoins = coinsEarned + finalCoinsDelta;
    setCoinsEarned(nextCoins);

    const wasClean = attemptsOnTask === 0;
    onSkillOutcome(currentTask.skill, wasClean);

    const logEntry: TaskLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      world: currentTask.world,
      level: currentTask.level,
      skill: currentTask.skill,
      parameters: { type: currentTask.type, expected: currentTask.expectedValue },
      expected: currentTask.expectedValue,
      input: payload.value,
      recognitionConfidence: payload.avgConfidence,
      clarified: payload.clarifiedCount > 0,
      errorCategories: categoriesLogged,
      helpLevel: attemptsOnTask,
      durationToFirstStrokeMs: firstStrokeRef.current ? firstStrokeRef.current - taskStartRef.current : 0,
      durationTotalMs: Date.now() - taskStartRef.current,
      attempts: attemptsOnTask + 1,
      animalHelpUsed: helpUsedOnTask,
    };
    void onLogTask(logEntry);

    const advanceTimer = window.setTimeout(() => {
      if (taskIdx + 1 >= taskQueue.length) {
        const stars = explorerMode
          ? 1
          : totalWrongAttempts <= 1 && !anyHelpUsedInLevel
            ? 3
            : totalWrongAttempts <= 2
              ? 2
              : 1;
        const levelBonus = APP_CONFIG.gameplay.levelBonusCoins + stars;
        const totalLevelCoins = nextCoins + levelBonus;
        soundEngine.playLevelFanfare(stars);
        setLevelDone({ stars, coins: totalLevelCoins });
        onLevelComplete(worldId, level, stars, totalLevelCoins, isDailyAdventure);
      } else {
        setTaskIdx((i) => i + 1);
      }
    }, 1350);
    hopTimersRef.current.push(advanceTimer);
  };

  const handleConfirmNumber = (payload: NumberConfirmPayload) => {
    if (!currentTask || !activeField || isHopping) return;

    const evalRes = evaluateFieldForWorld(currentTask.world, activeField, payload.value);
    const extraWritingFaults: ErrorCategoryCode[] = [];
    if (payload.mirroredDigits.length > 0) extraWritingFaults.push('S1_gespiegelt');
    if (payload.hadTensInWrongBox) extraWritingFaults.push('S2_falsches_kaestchen');
    if (payload.clarifiedCount >= 2) extraWritingFaults.push('S3_haeufige_rueckfrage');

    if (copySolutionTarget !== null) {
      if (payload.value === copySolutionTarget) {
        soundEngine.playSuccessChime();
        setFilledAnswers((prev) => ({ ...prev, [activeField.id]: payload.value }));
        setCopySolutionTarget(null);
        setTierMessage('Prima abgeschrieben! Die Aufgabe kommt später noch einmal als Übung.');
        const variationPool = generateWorldTasks(
          currentTask.world,
          currentTask.level,
          `${Date.now()}_retry`,
          state.settings
        );
        const variation = variationPool.find((t) => t.type === currentTask.type) ?? variationPool[0];
        if (variation && taskQueue.length < 11) {
          const insertAt = Math.min(taskQueue.length, taskIdx + 3);
          setTaskQueue((q) => {
            const copy = [...q];
            copy.splice(insertAt, 0, { ...variation, id: `${variation.id}_retry_${Date.now()}` });
            return copy;
          });
        }
        finishWholeTask(1, extraWritingFaults, payload);
        return;
      } else {
        soundEngine.playHmTone();
        setTierMessage(STRINGS_DE.level.copySolutionPrompt(copySolutionTarget));
        setPadResetKey((k) => k + 1);
        return;
      }
    }

    if (evalRes.correct) {
      const nextFilled = { ...filledAnswers, [activeField.id]: payload.value };
      setFilledAnswers(nextFilled);

      const nextUnfilledIdx = currentTask.fields.findIndex((f) => nextFilled[f.id] === undefined);
      if (nextUnfilledIdx >= 0) {
        soundEngine.playHopTone(activeFieldIdx);
        setMascotMood('nod');
        setActiveFieldIdx(nextUnfilledIdx);
        setTierMessage(`Super! Weiter mit: ${currentTask.fields[nextUnfilledIdx].label}`);
        setPadResetKey((k) => k + 1);
        return;
      }

      const rng = createRng(`${currentTask.id}_${Date.now()}`);
      const praise = rng.pick(STRINGS_DE.feedback.praise);
      const targetNum =
        currentTask.boardContext?.targetCell ??
        currentTask.numberLineContext?.targetMark ??
        currentTask.carryContext?.target ??
        currentTask.wallContext?.targetTop ??
        payload.value;
      const word = numberToGermanWords(targetNum);
      const path =
        currentTask.boardContext?.hopPath ??
        currentTask.numberLineContext?.hopPath ??
        (currentTask.carryContext
          ? [currentTask.carryContext.a, currentTask.carryContext.intermediateTen, currentTask.carryContext.target]
          : [targetNum]);

      const taskCoins = explorerMode
        ? 1
        : attemptsOnTask === 0
          ? APP_CONFIG.gameplay.coinsFirstTry
          : attemptsOnTask === 1
            ? APP_CONFIG.gameplay.coinsAfterHelp1
            : APP_CONFIG.gameplay.coinsAfterHelp2;

      animateHopAlongPath(
        path,
        () => {
          soundEngine.playSuccessChime();
          setTierMessage(praise);
          setLandingBadge({ number: targetNum, word });
          if (state.settings.readAloud) {
            speakGerman(word, true);
          }
          finishWholeTask(taskCoins, extraWritingFaults, payload);
        },
        'happy'
      );
      return;
    }

    // Gentle non-punitive error handling
    const nextAttempt = attemptsOnTask + 1;
    setAttemptsOnTask(nextAttempt);
    setTotalWrongAttempts((w) => w + 1);
    soundEngine.playHmTone();

    if (!heartLostOnTask && !explorerMode) {
      setHeartLostOnTask(true);
      setHearts((h) => {
        const nextH = Math.max(0, h - 1);
        if (nextH === 0) {
          setExplorerMode(true);
          setShowHelpPanel(true);
        }
        return nextH;
      });
    }

    const primaryFault = evalRes.categories[0] ?? 'X0_unklar';
    const faultHint = DIAGNOSTIC_HINTS[primaryFault].tierHinweis;
    const rng = createRng(`${currentTask.id}_err_${nextAttempt}`);
    const comfort = rng.pick(STRINGS_DE.feedback.comfort);

    // Log diagnostic fault immediately so Pattern Detector catches mistakes too!
    void onLogTask({
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      world: currentTask.world,
      level: currentTask.level,
      skill: currentTask.skill,
      parameters: { type: currentTask.type, expected: activeField.expected },
      expected: activeField.expected,
      input: payload.value,
      recognitionConfidence: payload.avgConfidence,
      clarified: payload.clarifiedCount > 0,
      errorCategories: [...evalRes.categories, ...extraWritingFaults],
      helpLevel: nextAttempt,
      durationToFirstStrokeMs: firstStrokeRef.current ? firstStrokeRef.current - taskStartRef.current : 0,
      durationTotalMs: Date.now() - taskStartRef.current,
      attempts: nextAttempt,
      animalHelpUsed: helpUsedOnTask,
    });

    const showHelpStage = () => {
      if (nextAttempt === 1) {
        setTierMessage(`${comfort} ${faultHint}`);
        setShowHelpPanel(true);
        setPadResetKey((k) => k + 1);
      } else if (nextAttempt === 2) {
        setHelpUsedOnTask(true);
        setAnyHelpUsedInLevel(true);
        setShowHelpPanel(true);
        const startFrom =
          currentTask.boardContext?.startCell ??
          currentTask.numberLineContext?.startMark ??
          activeField.expected;
        const demoPath =
          currentTask.world === 1
            ? buildBoardHopPath(startFrom, activeField.expected, state.settings.tafelStart)
            : [startFrom, activeField.expected];
        setTierMessage('Schau, ich hüpfe dir den richtigen Weg vor! Probier’s noch einmal.');
        animateHopAlongPath(demoPath, () => setPadResetKey((k) => k + 1), 'idle');
      } else {
        setHelpUsedOnTask(true);
        setAnyHelpUsedInLevel(true);
        setCopySolutionTarget(activeField.expected);
        setTierMessage(STRINGS_DE.level.copySolutionPrompt(activeField.expected));
        setPadResetKey((k) => k + 1);
      }
    };

    if (
      currentTask.world === 1 &&
      nextAttempt === 1 &&
      isValidBoardNumber(payload.value, state.settings.tafelStart)
    ) {
      const startFrom = currentTask.boardContext?.startCell ?? activeField.expected;
      animateHopAlongPath([startFrom, payload.value], showHelpStage, 'hm');
    } else if (
      currentTask.world === 2 &&
      nextAttempt === 1 &&
      currentTask.numberLineContext &&
      payload.value >= currentTask.numberLineContext.min &&
      payload.value <= currentTask.numberLineContext.max
    ) {
      animateHopAlongPath([currentTask.numberLineContext.startMark ?? payload.value, payload.value], showHelpStage, 'hm');
    } else {
      setMascotMood('hm');
      showHelpStage();
    }
  };

  const handleTapBoardCell = (num: number) => {
    if (!currentTask || isHopping) return;
    if (
      currentTask.inputMode === 'tap_board_then_number' &&
      !tapCompleted &&
      currentTask.boardContext?.tapTarget
    ) {
      if (num === currentTask.boardContext.tapTarget) {
        soundEngine.playSuccessChime();
        setTapCompleted(true);
        setMascotPos(num);
        setMascotMood('happy');
        setTierMessage(STRINGS_DE.level.tapSuccessNowWrite(num, activeField?.label ?? 'die Zahl'));
      } else {
        soundEngine.playHmTone();
        setMascotPos(num);
        setMascotMood('hm');
        setTierMessage(`Das ist die ${num}. Suche die ${currentTask.boardContext.tapTarget}!`);
      }
    }
  };

  const handleTapNumberLineMark = (mark: number) => {
    if (!currentTask || isHopping || currentTask.inputMode !== 'tap_mark') return;
    handleConfirmNumber({
      value: mark,
      tensDigit: Math.floor(mark / 10),
      onesDigit: mark % 10,
      hundredsDigit: null,
      mirroredDigits: [],
      clarifiedCount: 0,
      avgConfidence: 1,
      hadTensInWrongBox: false,
    });
  };

  if (!profile) return null;

  if (levelDone) {
    const worldTitle = isDailyAdventure
      ? 'Tagesabenteuer'
      : `${STRINGS_DE.worlds[worldId]?.name ?? 'Welt'} Level ${level}`;
    return (
      <div className="h-dvh overflow-y-auto no-scrollbar relative flex flex-col p-3 sm:p-4">
        <WorldBackdrop worldId={worldId} isDaily={isDailyAdventure} />
        <div className="relative z-10 my-auto mx-auto w-full max-w-lg rounded-3xl bg-white/95 border-2 border-slate-200 shadow-[0_8px_0_#CBD5E1] p-5 sm:p-7 short:p-4 flex flex-col items-center text-center gap-4 short:gap-2.5">
          <Mascot
            animal={profile.animal}
            mood="happy"
            size={104}
            reducedMotion={state.settings.reducedMotion}
            equipped={state.equippedAccessories}
          />

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-8 h-8 sm:w-10 sm:h-10 ${
                  s <= levelDone.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{worldTitle} geschafft!</h1>
            <p className="text-sm font-bold text-amber-700">{STRINGS_DE.level.summaryStars(levelDone.stars)}</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-700">
              {STRINGS_DE.level.summaryCoins(levelDone.coins)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            <button
              type="button"
              onClick={() => onOpenChest(levelDone.stars)}
              className="min-h-[54px] short:min-h-[46px] px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-sm sm:text-base shadow-[0_5px_0_#D97706] flex items-center gap-2"
            >
              <PackageOpen className="w-5 h-5" />
              <span>Truhe öffnen!</span>
            </button>

            {!isDailyAdventure && level < 8 && (
              <button
                type="button"
                onClick={() => onNextLevel(level + 1)}
                className="min-h-[54px] short:min-h-[46px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-[0_5px_0_#047857]"
              >
                {STRINGS_DE.level.summaryNextLevel}
              </button>
            )}

            <button
              type="button"
              onClick={onBackToMap}
              className="min-h-[48px] short:min-h-[44px] px-4 py-2 rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm"
            >
              {STRINGS_DE.level.summaryBackToMap}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTask) return null;

  return (
    <div className="h-dvh overflow-hidden relative p-2 sm:p-4 short:p-1.5 flex flex-col gap-2 short:gap-1.5">
      <WorldBackdrop worldId={currentTask.world} isDaily={isDailyAdventure} />
      {/* Quiet Level Top Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-slate-200 px-2.5 sm:px-3.5 py-1.5 short:py-1 shadow-[0_3px_0_#CBD5E1] flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onBackToMap}
          className="min-h-[40px] short:min-h-[36px] px-2.5 sm:px-3 py-1 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{STRINGS_DE.level.backToMap}</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {explorerMode ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
              <Compass className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">{STRINGS_DE.level.explorerModeLabel}</span>
              <span className="sm:hidden">Entdecker</span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 sm:gap-1" aria-label={`${hearts} Herzen`}>
              {[1, 2, 3].map((idx) => (
                <Heart
                  key={idx}
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    idx <= hearts ? 'text-rose-500 fill-rose-500' : 'text-slate-200 fill-slate-200'
                  }`}
                />
              ))}
            </div>
          )}

          <span className="text-xs sm:text-sm font-bold text-slate-600 tabular-nums whitespace-nowrap">
            {isDailyAdventure ? 'Tagesabenteuer · ' : `${STRINGS_DE.worlds[currentTask.world]?.name} · `}
            {STRINGS_DE.level.taskProgress(taskIdx + 1, taskQueue.length)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => speakGerman(currentTask.spokenPrompt, true)}
            title="Aufgabe einmal vorlesen"
            className="min-h-[40px] short:min-h-[36px] px-2.5 py-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1"
          >
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">{STRINGS_DE.level.readAloud}</span>
          </button>

          <button
            type="button"
            onClick={onToggleReadAloud}
            aria-label={state.settings.readAloud ? 'Automatisches Vorlesen ausschalten' : 'Automatisches Vorlesen einschalten'}
            title={state.settings.readAloud ? 'Auto-Vorlesen: An (Tippen zum Ausschalten)' : 'Auto-Vorlesen: Aus'}
            className={`min-h-[40px] short:min-h-[36px] px-2 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 ${
              state.settings.readAloud
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-slate-300 bg-slate-100 text-slate-500'
            }`}
          >
            {state.settings.readAloud ? <Megaphone className="w-4 h-4" /> : <MegaphoneOff className="w-4 h-4" />}
            <span className="hidden xl:inline">
              {state.settings.readAloud ? 'Auto an' : 'Aus'}
            </span>
          </button>

          {currentTask.world === 1 && (
            <button
              type="button"
              onClick={() => setShowDotView((v) => !v)}
              className={`min-h-[40px] short:min-h-[36px] px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 ${
                showDotView
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">
                {showDotView ? STRINGS_DE.level.boardViewToggle : STRINGS_DE.level.dotViewToggle}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setHelpUsedOnTask(true);
              setAnyHelpUsedInLevel(true);
              setShowHelpPanel((s) => !s);
            }}
            className="min-h-[40px] short:min-h-[36px] px-2.5 py-1 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1"
          >
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>{STRINGS_DE.level.helpButton}</span>
          </button>

          <FullscreenButton compact />
        </div>
      </header>

      {/* O6 Gentle 15-Minute Pause Reminder */}
      {showPauseHint && !pauseDismissed && (
        <div className="relative z-10 max-w-6xl w-full mx-auto rounded-2xl bg-amber-50 border-2 border-amber-300 px-3.5 py-1.5 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs sm:text-sm font-bold text-amber-950">{pauseReminderText}</span>
          <button
            type="button"
            onClick={() => setPauseDismissed(true)}
            className="px-3 py-1 rounded-xl bg-amber-200 text-amber-950 text-xs font-bold shrink-0"
          >
            Okay
          </button>
        </div>
      )}

      {/* Main Play Stage */}
      <main className="relative z-10 flex-1 min-h-0 max-w-6xl w-full mx-auto overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-2.5 sm:gap-3.5 items-start md:items-center short:items-start">
        {/* Left: Task Prompt + Interactive World Board */}
        <div className="space-y-2 short:space-y-1.5 min-h-0 min-w-0">
          <div className="bg-white rounded-2xl border-2 border-slate-200 px-3 py-2 short:px-3 short:py-1.5 shadow-[0_3px_0_#CBD5E1] flex items-center gap-2.5">
            <div className="shrink-0 short:hidden">
              <Mascot
                animal={profile.animal}
                mood={mascotMood}
                size={52}
                reducedMotion={state.settings.reducedMotion}
                equipped={state.equippedAccessories}
              />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h1 className="text-sm sm:text-lg short:text-sm font-bold text-slate-900 text-balance leading-snug">
                {currentTask.promptText}
              </h1>
              {currentTask.fields.length > 1 && activeField && (
                <p className="text-xs font-bold text-blue-700">
                  {STRINGS_DE.level.activeFieldHint(activeField.label)} ({activeFieldIdx + 1}/{currentTask.fields.length})
                </p>
              )}
              {isHopping && (
                <p className="text-[11px] font-semibold text-slate-500">{STRINGS_DE.level.skipHop}</p>
              )}
            </div>
          </div>

          {currentTask.world === 1 && (
            <HundertertafelBoard
              task={currentTask}
              animal={profile.animal}
              mascotMood={mascotMood}
              mascotCell={mascotPos}
              trailCells={trailPositions}
              activeFieldId={activeField?.id ?? null}
              filledAnswers={filledAnswers}
              tapCompleted={tapCompleted}
              showDotView={showDotView}
              showLandingBadge={landingBadge}
              reducedMotion={state.settings.reducedMotion}
              onTapCell={handleTapBoardCell}
              onSelectField={(fid) => {
                const idx = currentTask.fields.findIndex((f) => f.id === fid);
                if (idx >= 0 && filledAnswers[fid] === undefined) setActiveFieldIdx(idx);
              }}
              onSkipHop={() => skipHopRef.current?.()}
            />
          )}

          {currentTask.world === 2 && (
            <ZahlenstrahlBoard
              task={currentTask}
              animal={profile.animal}
              mascotMood={mascotMood}
              mascotMark={mascotPos}
              trailMarks={trailPositions}
              filledAnswers={filledAnswers}
              showLandingBadge={landingBadge}
              reducedMotion={state.settings.reducedMotion}
              onTapMark={handleTapNumberLineMark}
              onSkipHop={() => skipHopRef.current?.()}
            />
          )}

          {currentTask.world === 3 && (
            <ZehneruebergangBoard
              task={currentTask}
              animal={profile.animal}
              mascotMood={mascotMood}
              hopStep={carryHopStep}
              filledAnswers={filledAnswers}
              showLandingBadge={landingBadge}
              reducedMotion={state.settings.reducedMotion}
              onSkipHop={() => skipHopRef.current?.()}
            />
          )}

          {currentTask.world === 4 && (
            <RechenwerkstattBoard
              task={currentTask}
              animal={profile.animal}
              mascotMood={mascotMood}
              filledAnswers={filledAnswers}
              showLandingBadge={landingBadge}
              reducedMotion={state.settings.reducedMotion}
            />
          )}

          {currentTask.world === 5 && (
            <ZahlenmauerBoard
              task={currentTask}
              animal={profile.animal}
              mascotMood={mascotMood}
              activeFieldId={activeField?.id ?? null}
              filledAnswers={filledAnswers}
              showLandingBadge={landingBadge}
              reducedMotion={state.settings.reducedMotion}
              onSelectField={(fid) => {
                const idx = currentTask.fields.findIndex((f) => f.id === fid);
                if (idx >= 0 && filledAnswers[fid] === undefined) setActiveFieldIdx(idx);
              }}
            />
          )}
        </div>

        {/* Right: Feedback + Handwriting Input */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-3 sm:p-5 short:p-2 shadow-[0_4px_0_#CBD5E1] flex flex-col items-center gap-2.5 short:gap-1 min-w-0">
          {tierMessage && (
            <div className="w-full rounded-2xl bg-amber-50 border-2 border-amber-200 px-3 py-2 short:py-1 short:px-2.5 text-xs sm:text-sm short:text-[11px] short:leading-tight font-bold text-amber-950 text-center">
              {tierMessage}
            </div>
          )}

          {showHelpPanel && (
            <div className="w-full rounded-2xl bg-blue-50 border border-blue-200 px-4 py-2.5 short:py-1 short:px-2.5 text-xs sm:text-sm short:text-[11px] short:leading-tight font-semibold text-blue-900">
              {currentTask.helpText}
            </div>
          )}

          {currentTask.inputMode === 'tap_mark' ? (
            <div className="w-full rounded-2xl bg-teal-50 border-2 border-teal-200 p-6 text-center space-y-2">
              <p className="text-lg font-bold text-teal-900">
                Tippe auf den Strich für die {currentTask.numberLineContext?.tapTarget}!
              </p>
              <p className="text-xs text-teal-700">Tippe direkt links auf der Zahlenbrücke.</p>
            </div>
          ) : !tapCompleted && currentTask.boardContext?.tapTarget ? (
            <div className="w-full rounded-2xl bg-sky-50 border-2 border-sky-200 p-6 text-center space-y-2">
              <p className="text-lg font-bold text-sky-900">
                {STRINGS_DE.level.tapNumberFirst(currentTask.boardContext.tapTarget)}
              </p>
              <p className="text-xs text-sky-700">Tippe links auf das passende Zahlenfeld.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-2.5 short:gap-1">
              {copySolutionTarget !== null && (
                <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 px-5 py-2 short:px-3 short:py-0.5 text-base short:text-xs font-extrabold text-emerald-900">
                  Abschreiben: {copySolutionTarget}
                </div>
              )}

              <NumberInputPad
                key={padResetKey}
                allowHundreds={activeField?.allowHundreds}
                learnedTemplates={learnedTemplates}
                onSaveLearnedTemplate={onSaveLearnedTemplate}
                onConfirm={handleConfirmNumber}
                onFirstStrokeTime={() => {
                  if (firstStrokeRef.current === null) firstStrokeRef.current = Date.now();
                }}
                leftHanded={state.settings.leftHanded}
                disabled={isHopping}
              />
            </div>
          )}

          {explorerMode && (
            <button
              type="button"
              onClick={() => setSeedNonce((n) => n + 1)}
              className="min-h-[40px] px-4 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{STRINGS_DE.level.restartLevel}</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

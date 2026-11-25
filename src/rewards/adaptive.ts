import type { AppStateV1, SkillProgressEntry } from '../core/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDefaultSkillEntry(existingMastery = 0.2): SkillProgressEntry {
  return {
    mastery: Math.max(0, Math.min(1, existingMastery)),
    streak: 0,
    errorStreak: 0,
    nextReviewAt: 0,
  };
}

/**
 * Adaptive mastery update (Spec 6.4):
 * - Mastery score 0..1 per skill.
 * - 3 consecutive clean solves -> mastery +0.16 & spaced review pushes out (1 -> 3 -> 7 days).
 * - 2 consecutive errors -> mastery -0.14 & immediate review.
 */
export function updateSkillProgressEntry(
  prev: SkillProgressEntry | undefined,
  wasCleanFirstTry: boolean,
  nowMs = Date.now()
): SkillProgressEntry {
  const curr = prev ?? getDefaultSkillEntry();
  if (wasCleanFirstTry) {
    const nextStreak = curr.streak + 1;
    let nextMastery = curr.mastery;
    let reviewDays = 1;
    if (nextStreak >= 3) {
      nextMastery = Math.min(1, Number((curr.mastery + 0.16).toFixed(2)));
      reviewDays = nextMastery >= 0.8 ? 7 : nextMastery >= 0.5 ? 3 : 1;
    }
    return {
      mastery: nextMastery,
      streak: nextStreak >= 3 ? 0 : nextStreak,
      errorStreak: 0,
      nextReviewAt: nowMs + reviewDays * DAY_MS,
    };
  }

  const nextErr = curr.errorStreak + 1;
  const nextMastery =
    nextErr >= 2 ? Math.max(0, Number((curr.mastery - 0.14).toFixed(2))) : curr.mastery;

  return {
    mastery: nextMastery,
    streak: 0,
    errorStreak: nextErr >= 2 ? 0 : nextErr,
    nextReviewAt: nowMs,
  };
}

export function applySkillUpdate(
  state: AppStateV1,
  skill: string,
  wasCleanFirstTry: boolean,
  nowMs = Date.now()
): AppStateV1 {
  const prev = state.skillProgress[skill] ?? getDefaultSkillEntry(state.skillMastery[skill] ?? 0.2);
  const updated = updateSkillProgressEntry(prev, wasCleanFirstTry, nowMs);
  return {
    ...state,
    skillMastery: {
      ...state.skillMastery,
      [skill]: updated.mastery,
    },
    skillProgress: {
      ...state.skillProgress,
      [skill]: updated,
    },
  };
}

export function getSuggestedDifficultyTier(state: AppStateV1, skill: string): number {
  if (state.settings.difficultyMode === 'fixed') {
    return 3;
  }
  const mastery = state.skillProgress[skill]?.mastery ?? state.skillMastery[skill] ?? 0.25;
  if (mastery >= 0.85) return 5;
  if (mastery >= 0.65) return 4;
  if (mastery >= 0.45) return 3;
  if (mastery >= 0.25) return 2;
  return 1;
}

/**
 * Achievement engine — narrative milestones worth remembering, not a
 * competitive badge tally. Unlocks are idempotent and never compared between
 * players.
 */

import type { Achievement, ContentPack, PlayerState } from "../types";

export interface UnlockAchievementResult {
  state: PlayerState;
  unlocked: boolean;
}

export function unlockAchievement(state: PlayerState, achievementId: string): UnlockAchievementResult {
  if (state.achievements.includes(achievementId)) {
    return { state, unlocked: false };
  }
  return {
    state: { ...state, achievements: [...state.achievements, achievementId] },
    unlocked: true,
  };
}

export function hasAchievement(state: PlayerState, achievementId: string): boolean {
  return state.achievements.includes(achievementId);
}

export function listAchievements(pack: ContentPack, state: PlayerState): Achievement[] {
  return pack.achievements.filter((achievement) => state.achievements.includes(achievement.id));
}

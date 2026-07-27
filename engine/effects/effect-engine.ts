/**
 * Central place that turns a content-authored `Effect` into player state
 * changes + events. Used uniformly for choice outcomes, scene `onEnter`
 * triggers, and post-reflection effects, so the rules for "what an effect
 * does" only live in one place (see docs/ARCHITECTURE.md design principles).
 */

import { unlockAchievement } from "../achievements/achievement-engine";
import { addItem } from "../inventory/inventory-engine";
import { addJournalNote } from "../journal/reflection-journal";
import { awardPoints } from "../progression/progression-engine";
import { completeObjective, startQuest } from "../quest/quest-engine";
import type { ContentPack, Effect, GameEvent, PlayerState } from "../types";

export interface EffectResult {
  state: PlayerState;
  events: GameEvent[];
}

export function applyEffect(
  pack: ContentPack,
  state: PlayerState,
  effect: Effect | undefined,
): EffectResult {
  if (!effect) {
    return { state, events: [] };
  }

  let next = state;
  const events: GameEvent[] = [];

  if (effect.setFlags) {
    next = { ...next, flags: { ...next.flags, ...effect.setFlags } };
  }

  for (const itemId of effect.addItems ?? []) {
    const result = addItem(next, itemId);
    next = result.state;
    if (result.gained) {
      events.push({ type: "item_gained", itemId });
    }
  }

  if (effect.awardPoints) {
    const result = awardPoints(pack, next, effect.awardPoints);
    next = result.state;
    events.push(...result.events);
  }

  for (const achievementId of effect.unlockAchievements ?? []) {
    const result = unlockAchievement(next, achievementId);
    next = result.state;
    if (result.unlocked) {
      events.push({ type: "achievement_unlocked", achievementId });
    }
  }

  if (effect.startQuest) {
    const result = startQuest(next, effect.startQuest);
    next = result.state;
    if (result.started) {
      events.push({ type: "quest_started", questId: effect.startQuest });
    }
  }

  for (const { questId, objectiveId } of effect.completeObjectives ?? []) {
    const result = completeObjective(pack, next, questId, objectiveId);
    next = result.state;
    events.push(...result.events);
  }

  if (effect.addJournalNote) {
    next = addJournalNote(next, effect.addJournalNote);
  }

  return { state: next, events };
}

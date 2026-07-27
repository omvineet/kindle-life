/**
 * Quest engine — tracks objective completion for a single player's journey.
 * No fail states: a quest is simply not_started, active, or completed.
 */

import type { ContentPack, GameEvent, PlayerState, QuestProgress } from "../types";

const NOT_STARTED: QuestProgress = { status: "not_started", completedObjectiveIds: [] };

export function getQuestProgress(state: PlayerState, questId: string): QuestProgress {
  return state.quests[questId] ?? NOT_STARTED;
}

export interface StartQuestResult {
  state: PlayerState;
  started: boolean;
}

export function startQuest(state: PlayerState, questId: string): StartQuestResult {
  const existing = state.quests[questId];
  if (existing && existing.status !== "not_started") {
    return { state, started: false };
  }
  const progress: QuestProgress = {
    status: "active",
    completedObjectiveIds: existing?.completedObjectiveIds ?? [],
  };
  return { state: { ...state, quests: { ...state.quests, [questId]: progress } }, started: true };
}

export interface CompleteObjectiveResult {
  state: PlayerState;
  events: GameEvent[];
}

export function completeObjective(
  pack: ContentPack,
  state: PlayerState,
  questId: string,
  objectiveId: string,
): CompleteObjectiveResult {
  const quest = pack.quests.find((q) => q.id === questId);
  if (!quest) {
    throw new Error(`Unknown quest: ${questId}`);
  }
  if (!quest.objectives.some((objective) => objective.id === objectiveId)) {
    throw new Error(`Unknown objective "${objectiveId}" on quest "${questId}"`);
  }

  const progress = getQuestProgress(state, questId);
  if (progress.completedObjectiveIds.includes(objectiveId)) {
    return { state, events: [] };
  }

  const completedObjectiveIds = [...progress.completedObjectiveIds, objectiveId];
  const allComplete = quest.objectives.every((objective) =>
    completedObjectiveIds.includes(objective.id),
  );
  const nextProgress: QuestProgress = {
    status: allComplete ? "completed" : "active",
    completedObjectiveIds,
  };
  const nextState: PlayerState = {
    ...state,
    quests: { ...state.quests, [questId]: nextProgress },
  };

  const events: GameEvent[] = [{ type: "quest_objective_completed", questId, objectiveId }];
  if (allComplete) {
    events.push({ type: "quest_completed", questId });
  }
  return { state: nextState, events };
}

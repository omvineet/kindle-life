import { describe, expect, it } from "vitest";
import { completeObjective, getQuestProgress, startQuest } from "./quest-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("quest-engine", () => {
  it("reports not_started for a quest never touched", () => {
    const state = makeTestState();
    expect(getQuestProgress(state, "find-the-grove")).toEqual({
      status: "not_started",
      completedObjectiveIds: [],
    });
  });

  it("starts a quest", () => {
    const state = makeTestState();
    const result = startQuest(state, "find-the-grove");
    expect(result.started).toBe(true);
    expect(getQuestProgress(result.state, "find-the-grove").status).toBe("active");
  });

  it("does not restart an already active or completed quest", () => {
    const started = startQuest(makeTestState(), "find-the-grove").state;
    const result = startQuest(started, "find-the-grove");
    expect(result.started).toBe(false);
    expect(result.state).toBe(started);
  });

  it("completes objectives one at a time and finishes the quest once all are done", () => {
    const pack = makeTestPack();
    let state = startQuest(makeTestState(), "find-the-grove").state;

    const first = completeObjective(pack, state, "find-the-grove", "leave-hub");
    expect(first.events).toEqual([
      { type: "quest_objective_completed", questId: "find-the-grove", objectiveId: "leave-hub" },
    ]);
    state = first.state;
    expect(getQuestProgress(state, "find-the-grove").status).toBe("active");

    const second = completeObjective(pack, state, "find-the-grove", "reach-grove");
    expect(second.events).toEqual([
      {
        type: "quest_objective_completed",
        questId: "find-the-grove",
        objectiveId: "reach-grove",
      },
      { type: "quest_completed", questId: "find-the-grove" },
    ]);
    expect(getQuestProgress(second.state, "find-the-grove").status).toBe("completed");
  });

  it("is idempotent when completing the same objective twice", () => {
    const pack = makeTestPack();
    const started = startQuest(makeTestState(), "find-the-grove").state;
    const once = completeObjective(pack, started, "find-the-grove", "leave-hub").state;
    const twice = completeObjective(pack, once, "find-the-grove", "leave-hub");
    expect(twice.events).toEqual([]);
    expect(twice.state).toBe(once);
  });

  it("throws for an unknown quest or objective", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    expect(() => completeObjective(pack, state, "unknown-quest", "leave-hub")).toThrow();
    expect(() => completeObjective(pack, state, "find-the-grove", "unknown-objective")).toThrow();
  });
});

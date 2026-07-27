import { describe, expect, it } from "vitest";
import { applyEffect } from "./effect-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("effect-engine", () => {
  it("returns the state unchanged when there is no effect", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    const result = applyEffect(pack, state, undefined);
    expect(result).toEqual({ state, events: [] });
  });

  it("applies flags, items, points, achievements, quests, and a journal note in one pass", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    const result = applyEffect(pack, state, {
      setFlags: { metGuide: true },
      addItems: ["lotus-petal"],
      awardPoints: { compassion: 2 },
      unlockAchievements: ["first-steps"],
      startQuest: "find-the-grove",
      addJournalNote: "A quiet beginning.",
    });

    expect(result.state.flags).toEqual({ metGuide: true });
    expect(result.state.inventory).toEqual(["lotus-petal"]);
    expect(result.state.progression).toEqual({ compassion: 2 });
    expect(result.state.achievements).toEqual(["first-steps"]);
    expect(result.state.quests["find-the-grove"].status).toBe("active");
    expect(result.state.journal).toHaveLength(1);

    expect(result.events).toEqual(
      expect.arrayContaining([
        { type: "item_gained", itemId: "lotus-petal" },
        { type: "achievement_unlocked", achievementId: "first-steps" },
        { type: "quest_started", questId: "find-the-grove" },
      ]),
    );
  });

  it("completes quest objectives via completeObjectives and surfaces quest_completed", () => {
    const pack = makeTestPack();
    const started = applyEffect(pack, makeTestState(), { startQuest: "find-the-grove" }).state;
    const result = applyEffect(pack, started, {
      completeObjectives: [
        { questId: "find-the-grove", objectiveId: "leave-hub" },
        { questId: "find-the-grove", objectiveId: "reach-grove" },
      ],
    });
    expect(result.state.quests["find-the-grove"].status).toBe("completed");
    expect(result.events.map((event) => event.type)).toEqual([
      "quest_objective_completed",
      "quest_objective_completed",
      "quest_completed",
    ]);
  });

  it("does not mutate the input state", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    applyEffect(pack, state, { setFlags: { metGuide: true } });
    expect(state.flags).toEqual({});
  });
});

import { describe, expect, it } from "vitest";
import { GameEngine } from "./engine";
import { makeTestPack, makeTestState } from "./test-utils";

describe("GameEngine", () => {
  it("resolves the current scene from player state", () => {
    const engine = new GameEngine(makeTestPack());
    expect(engine.getCurrentScene(makeTestState()).id).toBe("hub");
  });

  it("choose() applies the chosen option's effect and returns events", () => {
    const engine = new GameEngine(makeTestPack());
    const result = engine.choose(makeTestState(), "hub-choice", "help");
    expect(result.state.inventory).toEqual(["lotus-petal"]);
    expect(result.state.progression).toEqual({ compassion: 2 });
    expect(result.events).toEqual([{ type: "item_gained", itemId: "lotus-petal" }]);
  });

  it("choose() only applies a choice's effect once, even if chosen again", () => {
    const engine = new GameEngine(makeTestPack());
    const once = engine.choose(makeTestState(), "hub-choice", "help").state;
    const twice = engine.choose(once, "hub-choice", "help");
    expect(twice.state.inventory).toEqual(["lotus-petal"]);
    expect(twice.state.progression).toEqual({ compassion: 2 });
    expect(twice.events).toEqual([]);

    // Picking the *other* option after the choice is already resolved is also a no-op.
    const other = engine.choose(once, "hub-choice", "reflect");
    expect(other.state).toEqual(once);
  });

  it("choose() throws for an unknown choice or option", () => {
    const engine = new GameEngine(makeTestPack());
    expect(() => engine.choose(makeTestState(), "not-a-choice", "help")).toThrow();
    expect(() => engine.choose(makeTestState(), "hub-choice", "not-an-option")).toThrow();
  });

  it("takeExit() moves scenes and fires the destination's onEnter effect", () => {
    const engine = new GameEngine(makeTestPack());
    const result = engine.takeExit(makeTestState(), "to-grove");
    expect(result.state.sceneId).toBe("grove");
    expect(result.state.quests["find-the-grove"]).toEqual({
      status: "active",
      completedObjectiveIds: ["reach-grove"],
    });
    expect(result.events).toEqual([
      { type: "quest_objective_completed", questId: "find-the-grove", objectiveId: "reach-grove" },
    ]);
  });

  it("takeExit() throws for an unavailable exit", () => {
    const engine = new GameEngine(makeTestPack());
    expect(() => engine.takeExit(makeTestState(), "not-an-exit")).toThrow();
  });

  it("submitReflection() records the answer and applies the reflection effect", () => {
    const engine = new GameEngine(makeTestPack());
    const result = engine.submitReflection(makeTestState(), "hub-reflection", "It felt calm.");
    expect(result.state.journal).toHaveLength(1);
    expect(result.state.progression).toEqual({ awareness: 1 });
  });

  it("submitReflection() only awards the reflection effect once, even if answered again", () => {
    const engine = new GameEngine(makeTestPack());
    const once = engine.submitReflection(makeTestState(), "hub-reflection", "First thought.");
    expect(once.state.progression).toEqual({ awareness: 1 });

    const twice = engine.submitReflection(once.state, "hub-reflection", "A revised thought.");
    expect(twice.state.progression).toEqual({ awareness: 1 });
    expect(twice.events).toEqual([]);
    expect(twice.state.journal.at(-1)?.answer).toBe("A revised thought.");
  });

  it("submitReflection() throws when the scene has no such prompt", () => {
    const engine = new GameEngine(makeTestPack());
    const state = makeTestState({ sceneId: "grove" });
    expect(() => engine.submitReflection(state, "hub-reflection", "answer")).toThrow();
  });

  it("exposes read-only summaries for inventory, achievements, progression, and quests", () => {
    const engine = new GameEngine(makeTestPack());
    const state = makeTestState({
      inventory: ["lotus-petal"],
      achievements: ["first-steps"],
      progression: { compassion: 2 },
    });
    expect(engine.listInventory(state).map((i) => i.id)).toEqual(["lotus-petal"]);
    expect(engine.listAchievements(state).map((a) => a.id)).toEqual(["first-steps"]);
    expect(engine.getProgressionSummary(state)[0]).toMatchObject({ points: 2, level: 1 });
    expect(engine.getQuestProgress(state, "find-the-grove").status).toBe("not_started");
    expect(engine.getJournalEntries(state)).toEqual([]);
    expect(engine.getAvailableExits(state).map((exit) => exit.id)).toEqual(["to-grove"]);
  });

  it("guards against a content loop of chained onEnter scene transitions", () => {
    const pack = makeTestPack({
      scenes: {
        ...makeTestPack().scenes,
        hub: {
          ...makeTestPack().scenes.hub,
          exits: [
            ...makeTestPack().scenes.hub.exits,
            { id: "to-loop-a", label: "Enter the loop", targetSceneId: "loop-a" },
          ],
        },
        "loop-a": {
          id: "loop-a",
          title: "Loop A",
          dialogue: [],
          onEnter: { goToScene: "loop-b" },
          exits: [],
        },
        "loop-b": {
          id: "loop-b",
          title: "Loop B",
          dialogue: [],
          onEnter: { goToScene: "loop-a" },
          exits: [],
        },
      },
    });
    const engine = new GameEngine(pack);
    expect(() => engine.takeExit(makeTestState(), "to-loop-a")).toThrow(/too deep/);
  });
});

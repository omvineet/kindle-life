import { describe, expect, it } from "vitest";
import { hasAchievement, listAchievements, unlockAchievement } from "./achievement-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("achievement-engine", () => {
  it("unlocks a new achievement", () => {
    const state = makeTestState();
    const result = unlockAchievement(state, "first-steps");
    expect(result.unlocked).toBe(true);
    expect(result.state.achievements).toEqual(["first-steps"]);
  });

  it("is idempotent when unlocking twice", () => {
    const state = makeTestState({ achievements: ["first-steps"] });
    const result = unlockAchievement(state, "first-steps");
    expect(result.unlocked).toBe(false);
    expect(result.state).toBe(state);
  });

  it("reports unlocked status", () => {
    const state = makeTestState({ achievements: ["first-steps"] });
    expect(hasAchievement(state, "first-steps")).toBe(true);
    expect(hasAchievement(state, "unknown")).toBe(false);
  });

  it("lists full achievement records for unlocked achievements only", () => {
    const pack = makeTestPack();
    const state = makeTestState({ achievements: ["first-steps"] });
    expect(listAchievements(pack, state).map((a) => a.id)).toEqual(["first-steps"]);
  });
});

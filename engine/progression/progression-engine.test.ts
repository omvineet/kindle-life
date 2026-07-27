import { describe, expect, it } from "vitest";
import {
  awardPoints,
  getLevelForPoints,
  getProgressionSummary,
  getTrackPoints,
  PROGRESSION_LEVELS,
} from "./progression-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("progression-engine", () => {
  it("starts every track at level 1 / Novice with zero points", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    const summary = getProgressionSummary(pack, state);
    expect(summary).toEqual([
      { track: pack.virtueTracks[0], points: 0, level: 1, title: "Novice", pointsToNextLevel: 3 },
      { track: pack.virtueTracks[1], points: 0, level: 1, title: "Novice", pointsToNextLevel: 3 },
    ]);
  });

  it("awards points to a track without affecting others", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    const result = awardPoints(pack, state, { compassion: 2 });
    expect(getTrackPoints(result.state, "compassion")).toBe(2);
    expect(getTrackPoints(result.state, "awareness")).toBe(0);
  });

  it("emits a level_up event when points cross a threshold", () => {
    const pack = makeTestPack();
    const state = makeTestState({ progression: { compassion: 2 } });
    const result = awardPoints(pack, state, { compassion: 1 });
    expect(result.events).toEqual([{ type: "level_up", trackId: "compassion", level: 2, title: "Seeker" }]);
  });

  it("does not emit a level_up event when staying within the same level", () => {
    const pack = makeTestPack();
    const state = makeTestState({ progression: { compassion: 3 } });
    const result = awardPoints(pack, state, { compassion: 1 });
    expect(result.events).toEqual([]);
  });

  it("can award multiple tracks at once, each with its own event", () => {
    const pack = makeTestPack();
    const state = makeTestState({ progression: { compassion: 2, awareness: 6 } });
    const result = awardPoints(pack, state, { compassion: 1, awareness: 1 });
    expect(result.events).toEqual([
      { type: "level_up", trackId: "compassion", level: 2, title: "Seeker" },
      { type: "level_up", trackId: "awareness", level: 3, title: "Adept" },
    ]);
  });

  it("throws when awarding points to a track the pack does not define", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    expect(() => awardPoints(pack, state, { courage: 1 })).toThrow();
  });

  it("has no highest-level entry with pointsToNextLevel left dangling incorrectly", () => {
    const highest = PROGRESSION_LEVELS[PROGRESSION_LEVELS.length - 1];
    expect(getLevelForPoints(highest.minPoints + 1000)).toEqual(highest);
  });
});

import { describe, expect, it } from "vitest";
import { createInitialPlayerState, deserializePlayerState, serializePlayerState } from "./save-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("save-engine", () => {
  it("creates a fresh player state at the pack's entry scene", () => {
    const pack = makeTestPack();
    const state = createInitialPlayerState(pack, "Ari");
    expect(state).toMatchObject({
      name: "Ari",
      packId: "test-pack",
      sceneId: "hub",
      flags: {},
      inventory: [],
      journal: [],
      achievements: [],
      quests: {},
      progression: {},
    });
  });

  it("throws when the pack's entryChapterId does not resolve", () => {
    const pack = makeTestPack({ entryChapterId: "missing-chapter" });
    expect(() => createInitialPlayerState(pack, "Ari")).toThrow();
  });

  it("round-trips a player state through serialize/deserialize", () => {
    const state = makeTestState({
      inventory: ["lotus-petal"],
      progression: { compassion: 3 },
      journal: [{ promptId: "hub-reflection", sceneId: "hub", answer: "Peaceful.", createdAt: "2026-01-01T00:00:00.000Z" }],
    });
    const roundTripped = deserializePlayerState(serializePlayerState(state));
    expect(roundTripped).toEqual(state);
  });

  it("fills in sensible defaults when deserializing a partial/legacy shape", () => {
    const state = deserializePlayerState({
      name: "Ari",
      packId: "test-pack",
      sceneId: "hub",
      flags: {},
      inventory: [],
      journal: [],
      achievements: [],
      quests: {},
      progression: {},
      // @ts-expect-error simulating a legacy row missing updatedAt
      updatedAt: undefined,
    });
    expect(state.updatedAt).toEqual(expect.any(String));
  });
});

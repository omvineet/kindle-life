import { describe, expect, it } from "vitest";
import { canTakeExit, getAvailableExits, getCurrentScene, getScene } from "./scene-navigation";
import { makeTestPack, makeTestState } from "../test-utils";

describe("scene-navigation", () => {
  it("resolves a scene by id", () => {
    const pack = makeTestPack();
    expect(getScene(pack, "hub").title).toBe("The Hub");
  });

  it("throws for an unknown scene id", () => {
    const pack = makeTestPack();
    expect(() => getScene(pack, "nowhere")).toThrow();
  });

  it("resolves the player's current scene from their state", () => {
    const pack = makeTestPack();
    const state = makeTestState({ sceneId: "grove" });
    expect(getCurrentScene(pack, state).id).toBe("grove");
  });

  it("only lists exits whose requiresFlag (if any) is satisfied", () => {
    const pack = makeTestPack({
      scenes: {
        ...makeTestPack().scenes,
        hub: {
          ...makeTestPack().scenes.hub,
          exits: [
            { id: "open", label: "Always open", targetSceneId: "grove" },
            { id: "gated", label: "Gated", targetSceneId: "grove", requiresFlag: "metGuide" },
          ],
        },
      },
    });
    const withoutFlag = makeTestState();
    expect(getAvailableExits(pack, withoutFlag).map((exit) => exit.id)).toEqual(["open"]);

    const withFlag = makeTestState({ flags: { metGuide: true } });
    expect(getAvailableExits(pack, withFlag).map((exit) => exit.id)).toEqual(["open", "gated"]);
  });

  it("canTakeExit reflects availability", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    expect(canTakeExit(pack, state, "to-grove")).toBe(true);
    expect(canTakeExit(pack, state, "unknown-exit")).toBe(false);
  });
});

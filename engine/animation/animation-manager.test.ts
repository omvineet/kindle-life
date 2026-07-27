import { describe, expect, it } from "vitest";
import { getDefaultSceneTransition, withDuration } from "./animation-manager";

describe("animation-manager", () => {
  it("provides a sensible default fade transition", () => {
    const transition = getDefaultSceneTransition();
    expect(transition.kind).toBe("fade");
    expect(transition.durationMs).toBeGreaterThan(0);
  });

  it("returns a new transition with an overridden duration", () => {
    const base = getDefaultSceneTransition();
    const custom = withDuration(base, 800);
    expect(custom).toEqual({ kind: "fade", durationMs: 800 });
    expect(base.durationMs).not.toBe(800);
  });

  it("rejects a negative duration", () => {
    expect(() => withDuration(getDefaultSceneTransition(), -1)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { getResolvedOptionId, hasResolvedChoice, resolveChoice } from "./choice-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("choice-engine", () => {
  it("applies the chosen option's effect and records the resolution", () => {
    const pack = makeTestPack();
    const state = makeTestState();
    const choice = pack.scenes.hub.choice!;

    const result = resolveChoice(pack, state, choice, "help");
    expect(result.state.inventory).toEqual(["lotus-petal"]);
    expect(hasResolvedChoice(result.state, "hub-choice")).toBe(true);
    expect(getResolvedOptionId(result.state, "hub-choice")).toBe("help");
  });

  it("does not re-apply the effect once the choice has been resolved", () => {
    const pack = makeTestPack();
    const choice = pack.scenes.hub.choice!;
    const state = makeTestState({ resolvedChoices: { "hub-choice": "help" } });

    const result = resolveChoice(pack, state, choice, "reflect");
    expect(result).toEqual({ state, events: [] });
    expect(getResolvedOptionId(result.state, "hub-choice")).toBe("help");
  });

  it("throws for an unknown option id", () => {
    const pack = makeTestPack();
    const choice = pack.scenes.hub.choice!;
    expect(() => resolveChoice(pack, makeTestState(), choice, "not-an-option")).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { addItem, hasItem, listInventory } from "./inventory-engine";
import { makeTestPack, makeTestState } from "../test-utils";

describe("inventory-engine", () => {
  it("adds a new item and reports it was gained", () => {
    const state = makeTestState();
    const result = addItem(state, "lotus-petal");
    expect(result.gained).toBe(true);
    expect(result.state.inventory).toEqual(["lotus-petal"]);
  });

  it("is idempotent when adding an item already held", () => {
    const state = makeTestState({ inventory: ["lotus-petal"] });
    const result = addItem(state, "lotus-petal");
    expect(result.gained).toBe(false);
    expect(result.state).toBe(state);
  });

  it("reports whether an item is held", () => {
    const state = makeTestState({ inventory: ["lotus-petal"] });
    expect(hasItem(state, "lotus-petal")).toBe(true);
    expect(hasItem(state, "unknown")).toBe(false);
  });

  it("lists full item records for held items only", () => {
    const pack = makeTestPack();
    const state = makeTestState({ inventory: ["lotus-petal"] });
    const items = listInventory(pack, state);
    expect(items.map((item) => item.id)).toEqual(["lotus-petal"]);
  });
});

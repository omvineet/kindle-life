import { describe, expect, it } from "vitest";
import {
  addJournalNote,
  getJournalEntries,
  hasReflected,
  recordReflection,
} from "./reflection-journal";
import { makeTestState } from "../test-utils";

describe("reflection-journal", () => {
  it("records a reflection answer", () => {
    const state = makeTestState();
    const next = recordReflection(state, "hub-reflection", "hub", "  The grove felt peaceful.  ");
    expect(getJournalEntries(next)).toHaveLength(1);
    expect(getJournalEntries(next)[0]).toMatchObject({
      promptId: "hub-reflection",
      sceneId: "hub",
      answer: "The grove felt peaceful.",
    });
  });

  it("ignores a blank answer", () => {
    const state = makeTestState();
    const next = recordReflection(state, "hub-reflection", "hub", "   ");
    expect(next).toBe(state);
  });

  it("replaces a prior answer to the same prompt rather than duplicating it", () => {
    let state = recordReflection(makeTestState(), "hub-reflection", "hub", "First answer");
    state = recordReflection(state, "hub-reflection", "hub", "Second answer");
    expect(getJournalEntries(state)).toHaveLength(1);
    expect(getJournalEntries(state)[0].answer).toBe("Second answer");
  });

  it("tracks whether a prompt has been answered", () => {
    const state = recordReflection(makeTestState(), "hub-reflection", "hub", "An answer");
    expect(hasReflected(state, "hub-reflection")).toBe(true);
    expect(hasReflected(state, "other-prompt")).toBe(false);
  });

  it("appends a system-authored note without touching prior reflections", () => {
    let state = recordReflection(makeTestState(), "hub-reflection", "hub", "An answer");
    state = addJournalNote(state, "You paused by the river.");
    expect(getJournalEntries(state)).toHaveLength(2);
    expect(getJournalEntries(state)[1]).toMatchObject({ promptId: "note" });
  });
});

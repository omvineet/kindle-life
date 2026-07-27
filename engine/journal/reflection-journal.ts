/**
 * Reflection journal — free-text, ungraded answers a Seeker writes for
 * themselves. There is no "correct" answer and nothing here is scored.
 */

import type { JournalEntry, PlayerState } from "../types";

/** Records (or replaces) a player's answer to a given reflection prompt. */
export function recordReflection(
  state: PlayerState,
  promptId: string,
  sceneId: string,
  answer: string,
): PlayerState {
  const trimmed = answer.trim();
  if (!trimmed) return state;

  const entry: JournalEntry = {
    promptId,
    sceneId,
    answer: trimmed,
    createdAt: new Date().toISOString(),
  };
  const withoutPriorAnswer = state.journal.filter((existing) => existing.promptId !== promptId);
  return { ...state, journal: [...withoutPriorAnswer, entry] };
}

/** Appends a system-authored note (e.g. a memorable moment) rather than a player answer. */
export function addJournalNote(state: PlayerState, note: string): PlayerState {
  const entry: JournalEntry = {
    promptId: "note",
    sceneId: state.sceneId,
    answer: note,
    createdAt: new Date().toISOString(),
  };
  return { ...state, journal: [...state.journal, entry] };
}

export function getJournalEntries(state: PlayerState): JournalEntry[] {
  return state.journal;
}

export function hasReflected(state: PlayerState, promptId: string): boolean {
  return state.journal.some((entry) => entry.promptId === promptId);
}

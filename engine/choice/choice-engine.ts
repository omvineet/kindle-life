/**
 * Choice engine — resolves a player's pick for a scene's branching choice.
 * Every option is a valid outcome (no "wrong" branch, per docs/VISION.md);
 * this module's job is purely to make resolution idempotent so a choice's
 * effect (points, items, achievements) is only ever applied once, even if
 * the player revisits the scene or the UI re-submits.
 */

import { applyEffect, type EffectResult } from "../effects/effect-engine";
import type { Choice, ContentPack, PlayerState } from "../types";

export function hasResolvedChoice(state: PlayerState, choiceId: string): boolean {
  return choiceId in state.resolvedChoices;
}

export function getResolvedOptionId(state: PlayerState, choiceId: string): string | undefined {
  return state.resolvedChoices[choiceId];
}

/**
 * Applies `optionId`'s effect if — and only if — this choice has not already
 * been resolved. Returns the unchanged state with no events otherwise.
 */
export function resolveChoice(
  pack: ContentPack,
  state: PlayerState,
  choice: Choice,
  optionId: string,
): EffectResult {
  if (hasResolvedChoice(state, choice.id)) {
    return { state, events: [] };
  }

  const option = choice.options.find((candidate) => candidate.id === optionId);
  if (!option) {
    throw new Error(`Choice "${choice.id}" has no option "${optionId}"`);
  }

  const recorded: PlayerState = {
    ...state,
    resolvedChoices: { ...state.resolvedChoices, [choice.id]: optionId },
  };
  return applyEffect(pack, recorded, option.effect);
}

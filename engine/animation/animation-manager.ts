/**
 * Animation manager — minimal, generic transition timing shared across
 * scenes. Kept deliberately small until real chapter content demands richer
 * sequencing; the UI layer (CSS transitions) does the actual animating.
 */

export type TransitionKind = "fade" | "none";

export interface SceneTransition {
  kind: TransitionKind;
  durationMs: number;
}

const DEFAULT_TRANSITION: SceneTransition = { kind: "fade", durationMs: 400 };

export function getDefaultSceneTransition(): SceneTransition {
  return DEFAULT_TRANSITION;
}

export function withDuration(transition: SceneTransition, durationMs: number): SceneTransition {
  if (durationMs < 0) {
    throw new Error("durationMs must not be negative");
  }
  return { ...transition, durationMs };
}

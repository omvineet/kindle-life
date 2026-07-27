/**
 * Scene navigation — resolves the current scene and which exits are open to
 * a player right now. Scene *transitions* (actually moving + firing an
 * onEnter effect) are orchestrated by `GameEngine` in engine/engine.ts, since
 * that needs to combine this with the effect engine.
 */

import type { ContentPack, PlayerState, Scene, SceneExit } from "../types";

export function getScene(pack: ContentPack, sceneId: string): Scene {
  const scene = pack.scenes[sceneId];
  if (!scene) {
    throw new Error(`Unknown scene: ${sceneId}`);
  }
  return scene;
}

export function getCurrentScene(pack: ContentPack, state: PlayerState): Scene {
  return getScene(pack, state.sceneId);
}

/** Exits whose `requiresFlag` (if any) is satisfied by the player's current flags. */
export function getAvailableExits(pack: ContentPack, state: PlayerState): SceneExit[] {
  const scene = getCurrentScene(pack, state);
  return scene.exits.filter((exit) => !exit.requiresFlag || state.flags[exit.requiresFlag] === true);
}

export function canTakeExit(pack: ContentPack, state: PlayerState, exitId: string): boolean {
  return getAvailableExits(pack, state).some((exit) => exit.id === exitId);
}

/**
 * GameEngine — the single entry point the platform layer (app/play/*) talks
 * to. It composes every subsystem behind a handful of methods that each take
 * the current `PlayerState` and return the next `PlayerState` plus any
 * `GameEvent`s worth celebrating in the UI (item gained, achievement
 * unlocked, level up, quest progress).
 */

import { listAchievements } from "./achievements/achievement-engine";
import { applyEffect } from "./effects/effect-engine";
import { listInventory } from "./inventory/inventory-engine";
import { getJournalEntries, recordReflection } from "./journal/reflection-journal";
import { getProgressionSummary } from "./progression/progression-engine";
import { getQuestProgress } from "./quest/quest-engine";
import { canTakeExit, getAvailableExits, getCurrentScene, getScene } from "./scene/scene-navigation";
import type { ContentPack, Effect, GameEvent, PlayerState, Scene, SceneExit } from "./types";

export interface EngineResult {
  state: PlayerState;
  events: GameEvent[];
}

const MAX_EFFECT_CHAIN_DEPTH = 10;

export class GameEngine {
  constructor(private readonly pack: ContentPack) {}

  getPack(): ContentPack {
    return this.pack;
  }

  getCurrentScene(state: PlayerState): Scene {
    return getCurrentScene(this.pack, state);
  }

  getAvailableExits(state: PlayerState): SceneExit[] {
    return getAvailableExits(this.pack, state);
  }

  getProgressionSummary(state: PlayerState) {
    return getProgressionSummary(this.pack, state);
  }

  listInventory(state: PlayerState) {
    return listInventory(this.pack, state);
  }

  listAchievements(state: PlayerState) {
    return listAchievements(this.pack, state);
  }

  getJournalEntries(state: PlayerState) {
    return getJournalEntries(state);
  }

  getQuestProgress(state: PlayerState, questId: string) {
    return getQuestProgress(state, questId);
  }

  /** Select an option for the scene's current choice. */
  choose(state: PlayerState, choiceId: string, optionId: string): EngineResult {
    const scene = getCurrentScene(this.pack, state);
    if (!scene.choice || scene.choice.id !== choiceId) {
      throw new Error(`Scene "${scene.id}" has no choice "${choiceId}"`);
    }
    const option = scene.choice.options.find((candidate) => candidate.id === optionId);
    if (!option) {
      throw new Error(`Choice "${choiceId}" has no option "${optionId}"`);
    }
    return this.applyEffectAndEnter(state, option.effect);
  }

  /** Move to another scene via one of the current scene's exits. */
  takeExit(state: PlayerState, exitId: string): EngineResult {
    if (!canTakeExit(this.pack, state, exitId)) {
      throw new Error(`Exit "${exitId}" is not available from scene "${state.sceneId}"`);
    }
    const scene = getCurrentScene(this.pack, state);
    const exit = scene.exits.find((candidate) => candidate.id === exitId)!;
    return this.enterScene(state, exit.targetSceneId);
  }

  /** Record the player's answer to the current scene's reflection prompt. */
  submitReflection(state: PlayerState, promptId: string, answer: string): EngineResult {
    const scene = getCurrentScene(this.pack, state);
    if (!scene.reflection || scene.reflection.id !== promptId) {
      throw new Error(`Scene "${scene.id}" has no reflection prompt "${promptId}"`);
    }
    const reflected = recordReflection(state, promptId, scene.id, answer);
    return this.applyEffectAndEnter(reflected, scene.reflectionEffect);
  }

  private applyEffectAndEnter(
    state: PlayerState,
    effect: Effect | undefined,
    depth = 0,
  ): EngineResult {
    const { state: afterEffect, events } = applyEffect(this.pack, state, effect);
    if (effect?.goToScene) {
      const entered = this.enterScene(afterEffect, effect.goToScene, depth);
      return { state: entered.state, events: [...events, ...entered.events] };
    }
    return { state: afterEffect, events };
  }

  private enterScene(state: PlayerState, sceneId: string, depth = 0): EngineResult {
    if (depth > MAX_EFFECT_CHAIN_DEPTH) {
      throw new Error(
        `Effect chain too deep entering scene "${sceneId}" — check content for a scene loop`,
      );
    }
    const scene = getScene(this.pack, sceneId);
    const moved: PlayerState = { ...state, sceneId };
    return this.applyEffectAndEnter(moved, scene.onEnter, depth + 1);
  }
}

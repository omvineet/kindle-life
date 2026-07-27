/**
 * GameEngine — the single entry point the platform layer (app/play/*) talks
 * to. It composes every subsystem behind a handful of methods that each take
 * the current `PlayerState` and return the next `PlayerState` plus any
 * `GameEvent`s worth celebrating in the UI (item gained, achievement
 * unlocked, level up, quest progress).
 */

import { listAchievements } from "./achievements/achievement-engine";
import { resolveChoice } from "./choice/choice-engine";
import { applyEffect } from "./effects/effect-engine";
import { listInventory } from "./inventory/inventory-engine";
import { getJournalEntries, hasReflected, recordReflection } from "./journal/reflection-journal";
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

  /**
   * Select an option for the scene's current choice. Every option is a valid
   * outcome; if this choice was already resolved, the effect will not
   * re-apply (see engine/choice/choice-engine.ts).
   */
  choose(state: PlayerState, choiceId: string, optionId: string): EngineResult {
    const scene = getCurrentScene(this.pack, state);
    if (!scene.choice || scene.choice.id !== choiceId) {
      throw new Error(`Scene "${scene.id}" has no choice "${choiceId}"`);
    }
    const option = scene.choice.options.find((candidate) => candidate.id === optionId);
    if (!option) {
      throw new Error(`Choice "${choiceId}" has no option "${optionId}"`);
    }

    const { state: afterChoice, events } = resolveChoice(this.pack, state, scene.choice, optionId);
    const entered = this.maybeEnterScene(afterChoice, option.effect, 0);
    return { state: entered.state, events: [...events, ...entered.events] };
  }

  /** Move to another scene via one of the current scene's exits. */
  takeExit(state: PlayerState, exitId: string): EngineResult {
    if (!canTakeExit(this.pack, state, exitId)) {
      throw new Error(`Exit "${exitId}" is not available from scene "${state.sceneId}"`);
    }
    const scene = getCurrentScene(this.pack, state);
    const exit = scene.exits.find((candidate) => candidate.id === exitId)!;
    return this.enterScene(state, exit.targetSceneId, 0);
  }

  /**
   * Record the player's answer to the current scene's reflection prompt. The
   * reflection effect (if any) only ever fires the first time — editing a
   * saved answer later updates the journal without re-awarding points.
   */
  submitReflection(state: PlayerState, promptId: string, answer: string): EngineResult {
    const scene = getCurrentScene(this.pack, state);
    if (!scene.reflection || scene.reflection.id !== promptId) {
      throw new Error(`Scene "${scene.id}" has no reflection prompt "${promptId}"`);
    }
    const alreadyReflected = hasReflected(state, promptId);
    const reflected = recordReflection(state, promptId, scene.id, answer);
    if (alreadyReflected) {
      return { state: reflected, events: [] };
    }
    const { state: afterEffect, events } = applyEffect(this.pack, reflected, scene.reflectionEffect);
    const entered = this.maybeEnterScene(afterEffect, scene.reflectionEffect, 0);
    return { state: entered.state, events: [...events, ...entered.events] };
  }

  /** If `effect` requests a scene transition, moves there and fires its onEnter effect (possibly chained). */
  private maybeEnterScene(
    state: PlayerState,
    effect: Effect | undefined,
    depth: number,
  ): EngineResult {
    if (!effect?.goToScene) {
      return { state, events: [] };
    }
    return this.enterScene(state, effect.goToScene, depth);
  }

  private enterScene(state: PlayerState, sceneId: string, depth: number): EngineResult {
    if (depth > MAX_EFFECT_CHAIN_DEPTH) {
      throw new Error(
        `Effect chain too deep entering scene "${sceneId}" — check content for a scene loop`,
      );
    }
    const scene = getScene(this.pack, sceneId);
    const moved: PlayerState = { ...state, sceneId };
    const { state: afterEnter, events } = applyEffect(this.pack, moved, scene.onEnter);
    const chained = this.maybeEnterScene(afterEnter, scene.onEnter, depth + 1);
    return { state: chained.state, events: [...events, ...chained.events] };
  }
}

/**
 * Loads a content pack from disk (see docs/ARCHITECTURE.md — "Content" layer)
 * and validates every cross-reference so a broken chapter fails loudly with a
 * precise error instead of crashing mid-scene for a player.
 */

import fs from "node:fs";
import path from "node:path";
import {
  chapterSchema,
  contentPackManifestSchema,
  sceneSchema,
  type Chapter,
  type ContentPack,
  type ContentPackManifest,
  type Effect,
  type Scene,
} from "../types";

const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");

const cache = new Map<string, ContentPack>();

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Content file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Invalid JSON in ${filePath}: ${message}`);
  }
}

/**
 * Load and validate a content pack by id. Results are cached per (rootDir, packId)
 * for the lifetime of the process — content is static once deployed.
 */
export function loadContentPack(
  packId: string,
  rootDir: string = DEFAULT_CONTENT_ROOT,
): ContentPack {
  const cacheKey = `${rootDir}::${packId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const packDir = path.join(rootDir, packId);
  const manifestRaw = readJson(path.join(packDir, "pack.json"));
  const manifestResult = contentPackManifestSchema.safeParse(manifestRaw);
  if (!manifestResult.success) {
    throw new Error(
      `Invalid content pack manifest for "${packId}": ${manifestResult.error.message}`,
    );
  }
  const manifest = manifestResult.data;
  if (manifest.id !== packId) {
    throw new Error(
      `Pack id mismatch: folder "${packId}" declares id "${manifest.id}" in pack.json`,
    );
  }

  const chapters: Record<string, Chapter> = {};
  const scenes: Record<string, Scene> = {};

  for (const chapterId of manifest.chapterIds) {
    const chapterDir = path.join(packDir, "chapters", chapterId);
    const chapterRaw = readJson(path.join(chapterDir, "chapter.json"));
    const chapterResult = chapterSchema.safeParse(chapterRaw);
    if (!chapterResult.success) {
      throw new Error(
        `Invalid chapter "${chapterId}" in pack "${packId}": ${chapterResult.error.message}`,
      );
    }
    const chapter = chapterResult.data;
    if (chapter.id !== chapterId) {
      throw new Error(
        `Chapter id mismatch: folder "${chapterId}" declares id "${chapter.id}" in chapter.json`,
      );
    }
    chapters[chapter.id] = chapter;

    for (const sceneId of chapter.sceneIds) {
      const sceneRaw = readJson(path.join(chapterDir, "scenes", `${sceneId}.json`));
      const sceneResult = sceneSchema.safeParse(sceneRaw);
      if (!sceneResult.success) {
        throw new Error(
          `Invalid scene "${sceneId}" in chapter "${chapterId}" of pack "${packId}": ${sceneResult.error.message}`,
        );
      }
      const scene = sceneResult.data;
      if (scene.id !== sceneId) {
        throw new Error(
          `Scene id mismatch: file "${sceneId}.json" declares id "${scene.id}" in chapter "${chapterId}"`,
        );
      }
      scenes[scene.id] = scene;
    }
  }

  validateCrossReferences(manifest.id, manifest, chapters, scenes);

  const pack: ContentPack = { ...manifest, chapters, scenes };
  cache.set(cacheKey, pack);
  return pack;
}

/** Test/dev helper — content packs are cached per-process for performance. */
export function clearContentCache(): void {
  cache.clear();
}

function validateCrossReferences(
  packId: string,
  manifest: ContentPackManifest,
  chapters: Record<string, Chapter>,
  scenes: Record<string, Scene>,
): void {
  if (!chapters[manifest.entryChapterId]) {
    throw new Error(
      `Pack "${packId}" entryChapterId "${manifest.entryChapterId}" was not found among its chapters`,
    );
  }

  for (const chapter of Object.values(chapters)) {
    if (!scenes[chapter.entrySceneId]) {
      throw new Error(
        `Chapter "${chapter.id}" entrySceneId "${chapter.entrySceneId}" was not found among its scenes`,
      );
    }
  }

  const virtueTrackIds = new Set(manifest.virtueTracks.map((track) => track.id));
  const questIds = new Set(manifest.quests.map((quest) => quest.id));
  const achievementIds = new Set(manifest.achievements.map((achievement) => achievement.id));
  const itemIds = new Set(manifest.items.map((item) => item.id));
  const questObjectiveIds = new Map(
    manifest.quests.map((quest) => [quest.id, new Set(quest.objectives.map((o) => o.id))]),
  );

  for (const scene of Object.values(scenes)) {
    for (const exit of scene.exits) {
      if (!scenes[exit.targetSceneId]) {
        throw new Error(
          `Scene "${scene.id}" has an exit "${exit.id}" to unknown scene "${exit.targetSceneId}"`,
        );
      }
    }

    const effects: Effect[] = [
      scene.onEnter,
      scene.reflectionEffect,
      ...(scene.choice?.options.map((option) => option.effect) ?? []),
    ].filter((effect): effect is Effect => Boolean(effect));

    for (const effect of effects) {
      validateEffectReferences(effect, scene.id, {
        scenes,
        virtueTrackIds,
        questIds,
        questObjectiveIds,
        achievementIds,
        itemIds,
      });
    }
  }
}

interface ReferenceSets {
  scenes: Record<string, Scene>;
  virtueTrackIds: Set<string>;
  questIds: Set<string>;
  questObjectiveIds: Map<string, Set<string>>;
  achievementIds: Set<string>;
  itemIds: Set<string>;
}

function validateEffectReferences(effect: Effect, sceneId: string, refs: ReferenceSets): void {
  if (effect.goToScene && !refs.scenes[effect.goToScene]) {
    throw new Error(`Scene "${sceneId}" effect transitions to unknown scene "${effect.goToScene}"`);
  }
  for (const trackId of Object.keys(effect.awardPoints ?? {})) {
    if (!refs.virtueTrackIds.has(trackId)) {
      throw new Error(`Scene "${sceneId}" effect awards points to unknown virtue track "${trackId}"`);
    }
  }
  if (effect.startQuest && !refs.questIds.has(effect.startQuest)) {
    throw new Error(`Scene "${sceneId}" effect starts unknown quest "${effect.startQuest}"`);
  }
  for (const { questId, objectiveId } of effect.completeObjectives ?? []) {
    const objectives = refs.questObjectiveIds.get(questId);
    if (!objectives) {
      throw new Error(`Scene "${sceneId}" effect references unknown quest "${questId}"`);
    }
    if (!objectives.has(objectiveId)) {
      throw new Error(
        `Scene "${sceneId}" effect references unknown objective "${objectiveId}" on quest "${questId}"`,
      );
    }
  }
  for (const achievementId of effect.unlockAchievements ?? []) {
    if (!refs.achievementIds.has(achievementId)) {
      throw new Error(`Scene "${sceneId}" effect unlocks unknown achievement "${achievementId}"`);
    }
  }
  for (const itemId of effect.addItems ?? []) {
    if (!refs.itemIds.has(itemId)) {
      throw new Error(`Scene "${sceneId}" effect adds unknown item "${itemId}"`);
    }
  }
}

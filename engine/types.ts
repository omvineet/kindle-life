/**
 * Generic, book-agnostic game engine types.
 *
 * This file must never reference "Seeker", "Kindle Life", or any other
 * book-specific concept — see docs/ARCHITECTURE.md's three-layer boundary.
 * A content pack (see engine/content/content-loader.ts) supplies all of the
 * book-specific meaning; the engine only knows about generic scenes,
 * choices, quests, reflections, virtue tracks, and collectibles.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Content schema (validated with zod when a pack is loaded from disk)
// ---------------------------------------------------------------------------

export const virtueTrackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});
export type VirtueTrack = z.infer<typeof virtueTrackSchema>;

export const dialogueLineSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
  portrait: z.string().optional(),
});
export type DialogueLine = z.infer<typeof dialogueLineSchema>;

/**
 * Side effects a scene can trigger — on entering a scene, after choosing an
 * option, or after submitting a reflection. Every field is additive/optional
 * so content authors only specify what actually happens.
 */
export const effectSchema = z.object({
  setFlags: z.record(z.string(), z.boolean()).optional(),
  addItems: z.array(z.string().min(1)).optional(),
  /** Freeform system-authored note appended to the journal (distinct from a player-authored reflection answer). */
  addJournalNote: z.string().optional(),
  /** Virtue track id -> points awarded. Always additive, always private to this player. */
  awardPoints: z.record(z.string(), z.number()).optional(),
  unlockAchievements: z.array(z.string().min(1)).optional(),
  startQuest: z.string().min(1).optional(),
  completeObjectives: z
    .array(z.object({ questId: z.string().min(1), objectiveId: z.string().min(1) }))
    .optional(),
  /** Transition to another scene once the rest of this effect has been applied. */
  goToScene: z.string().min(1).optional(),
});
export type Effect = z.infer<typeof effectSchema>;

export const choiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  effect: effectSchema.optional(),
});
export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

/** A branching moment with no "wrong" option — every path is a valid outcome. */
export const choiceSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(choiceOptionSchema).min(2),
});
export type Choice = z.infer<typeof choiceSchema>;

export const sceneExitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  targetSceneId: z.string().min(1),
  /** Exit is hidden until this flag is set (e.g. a quest step must be done first). */
  requiresFlag: z.string().optional(),
});
export type SceneExit = z.infer<typeof sceneExitSchema>;

export const questObjectiveSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});
export type QuestObjective = z.infer<typeof questObjectiveSchema>;

export const questSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  objectives: z.array(questObjectiveSchema).min(1),
});
export type Quest = z.infer<typeof questSchema>;

export const reflectionPromptSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  placeholder: z.string().optional(),
});
export type ReflectionPrompt = z.infer<typeof reflectionPromptSchema>;

export const achievementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional(),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const collectibleItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional(),
});
export type CollectibleItem = z.infer<typeof collectibleItemSchema>;

export const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Asset key resolved via lib/assets.ts — never a raw URL. */
  background: z.string().optional(),
  music: z.string().optional(),
  dialogue: z.array(dialogueLineSchema).default([]),
  /** Applied automatically the moment a player arrives at this scene. */
  onEnter: effectSchema.optional(),
  choice: choiceSchema.optional(),
  reflection: reflectionPromptSchema.optional(),
  /** Applied after the player submits the reflection above. */
  reflectionEffect: effectSchema.optional(),
  exits: z.array(sceneExitSchema).default([]),
});
export type Scene = z.infer<typeof sceneSchema>;

export const chapterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.number(),
  entrySceneId: z.string().min(1),
  sceneIds: z.array(z.string().min(1)).min(1),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const contentPackManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  version: z.string().min(1),
  entryChapterId: z.string().min(1),
  chapterIds: z.array(z.string().min(1)).min(1),
  virtueTracks: z.array(virtueTrackSchema).default([]),
  quests: z.array(questSchema).default([]),
  achievements: z.array(achievementSchema).default([]),
  items: z.array(collectibleItemSchema).default([]),
});
export type ContentPackManifest = z.infer<typeof contentPackManifestSchema>;

/** A fully loaded, validated, cross-referenced content pack — the engine's only input besides `PlayerState`. */
export interface ContentPack extends ContentPackManifest {
  chapters: Record<string, Chapter>;
  scenes: Record<string, Scene>;
}

// ---------------------------------------------------------------------------
// Player state (persisted verbatim as JSON — see engine/save/save-engine.ts)
// ---------------------------------------------------------------------------

export interface JournalEntry {
  /** Reflection prompt id, or "note" for a system-authored journal note. */
  promptId: string;
  sceneId: string;
  answer: string;
  createdAt: string;
}

export type QuestStatus = "not_started" | "active" | "completed";

export interface QuestProgress {
  status: QuestStatus;
  completedObjectiveIds: string[];
}

/**
 * The canonical, plain-JSON shape of a player's journey through one content
 * pack. Nothing here is compared or ranked against any other player's state.
 */
export interface PlayerState {
  name: string;
  avatarKey?: string;
  packId: string;
  sceneId: string;
  flags: Record<string, boolean>;
  /** Collectible item ids. */
  inventory: string[];
  journal: JournalEntry[];
  /** Achievement ids. */
  achievements: string[];
  /** Quest id -> progress. */
  quests: Record<string, QuestProgress>;
  /** Virtue track id -> accumulated points. Individual growth only, never a global score. */
  progression: Record<string, number>;
  /** Choice id -> chosen option id. Once a choice is resolved its effect never re-applies (no farming points by re-clicking). */
  resolvedChoices: Record<string, string>;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Events — returned by engine actions so the UI can surface toasts/celebrations
// ---------------------------------------------------------------------------

export type GameEvent =
  | { type: "item_gained"; itemId: string }
  | { type: "achievement_unlocked"; achievementId: string }
  | { type: "level_up"; trackId: string; level: number; title: string }
  | { type: "quest_started"; questId: string }
  | { type: "quest_objective_completed"; questId: string; objectiveId: string }
  | { type: "quest_completed"; questId: string };

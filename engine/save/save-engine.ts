/**
 * Save engine — creates a fresh player state for a pack, and converts
 * `PlayerState` to/from a plain JSON shape suitable for persistence. Contains
 * no I/O; the platform layer (lib/game/save-repository.ts) owns actually
 * reading/writing rows.
 */

import type { ContentPack, JournalEntry, PlayerState, QuestProgress } from "../types";

export function createInitialPlayerState(
  pack: ContentPack,
  name: string,
  avatarKey?: string,
): PlayerState {
  const entryChapter = pack.chapters[pack.entryChapterId];
  if (!entryChapter) {
    throw new Error(`Pack "${pack.id}" has no chapter matching entryChapterId "${pack.entryChapterId}"`);
  }
  return {
    name,
    avatarKey,
    packId: pack.id,
    sceneId: entryChapter.entrySceneId,
    flags: {},
    inventory: [],
    journal: [],
    achievements: [],
    quests: {},
    progression: {},
    updatedAt: new Date().toISOString(),
  };
}

/** Plain-JSON mirror of `PlayerState`, safe to store as Prisma `Json` columns. */
export interface SerializedPlayerState {
  name: string;
  avatarKey?: string;
  packId: string;
  sceneId: string;
  flags: Record<string, boolean>;
  inventory: string[];
  journal: JournalEntry[];
  achievements: string[];
  quests: Record<string, QuestProgress>;
  progression: Record<string, number>;
  updatedAt: string;
}

export function serializePlayerState(state: PlayerState): SerializedPlayerState {
  return { ...state };
}

export function deserializePlayerState(data: SerializedPlayerState): PlayerState {
  return {
    name: data.name,
    avatarKey: data.avatarKey,
    packId: data.packId,
    sceneId: data.sceneId,
    flags: data.flags ?? {},
    inventory: data.inventory ?? [],
    journal: data.journal ?? [],
    achievements: data.achievements ?? [],
    quests: data.quests ?? {},
    progression: data.progression ?? {},
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

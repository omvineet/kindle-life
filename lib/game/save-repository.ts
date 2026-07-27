import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  createInitialPlayerState,
  deserializePlayerState,
  serializePlayerState,
  type ContentPack,
  type JournalEntry,
  type PlayerState,
  type QuestProgress,
} from "@/engine";

/**
 * The only module that knows about both Prisma's `SaveState` rows and the
 * engine's `PlayerState` shape. Keeping the mapping in one place means the
 * engine (engine/save/save-engine.ts) never has to import Prisma.
 */

/** `PlayerState`'s fields are always plain JSON; Prisma just wants that spelled out. */
function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toPlayerState(
  playerName: string,
  row: {
    packId: string;
    sceneId: string;
    flags: unknown;
    inventory: unknown;
    journal: unknown;
    achievements: unknown;
    quests: unknown;
    progression: unknown;
    resolvedChoices: unknown;
    updatedAt: Date;
  },
): PlayerState {
  return deserializePlayerState({
    name: playerName,
    packId: row.packId,
    sceneId: row.sceneId,
    flags: row.flags as Record<string, boolean>,
    inventory: row.inventory as string[],
    journal: row.journal as JournalEntry[],
    achievements: row.achievements as string[],
    quests: row.quests as Record<string, QuestProgress>,
    progression: row.progression as Record<string, number>,
    resolvedChoices: row.resolvedChoices as Record<string, string>,
    updatedAt: row.updatedAt.toISOString(),
  });
}

/** Loads a player's existing save for this pack, or creates a fresh one at the pack's entry scene. */
export async function loadOrCreateSaveState(
  pack: ContentPack,
  playerId: string,
  playerName: string,
): Promise<PlayerState> {
  const existing = await prisma.saveState.findUnique({
    where: { playerId_packId: { playerId, packId: pack.id } },
  });
  if (existing) {
    return toPlayerState(playerName, existing);
  }

  const initial = createInitialPlayerState(pack, playerName);
  const data = serializePlayerState(initial);
  await prisma.saveState.create({
    data: {
      playerId,
      packId: data.packId,
      sceneId: data.sceneId,
      flags: toJson(data.flags),
      inventory: toJson(data.inventory),
      journal: toJson(data.journal),
      achievements: toJson(data.achievements),
      quests: toJson(data.quests),
      progression: toJson(data.progression),
      resolvedChoices: toJson(data.resolvedChoices),
    },
  });
  return initial;
}

/** Persists the result of an engine action back onto the player's save row. */
export async function persistSaveState(playerId: string, state: PlayerState): Promise<void> {
  const data = serializePlayerState(state);
  await prisma.saveState.update({
    where: { playerId_packId: { playerId, packId: state.packId } },
    data: {
      sceneId: data.sceneId,
      flags: toJson(data.flags),
      inventory: toJson(data.inventory),
      journal: toJson(data.journal),
      achievements: toJson(data.achievements),
      quests: toJson(data.quests),
      progression: toJson(data.progression),
      resolvedChoices: toJson(data.resolvedChoices),
    },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { GameEngine, loadContentPack, type GameEvent, type PlayerState } from "@/engine";
import { beginPlayerSession, getCurrentPlayer } from "@/lib/game/session";
import { loadOrCreateSaveState, persistSaveState } from "@/lib/game/save-repository";
import { ACTIVE_PACK_ID } from "./constants";

const MAX_NAME_LENGTH = 40;

async function loadEngineContext() {
  const player = await getCurrentPlayer();
  if (!player) {
    throw new Error("No active journey yet — begin one first.");
  }
  const pack = loadContentPack(ACTIVE_PACK_ID);
  const engine = new GameEngine(pack);
  const state = await loadOrCreateSaveState(pack, player.id, player.displayName);
  return { playerId: player.id, engine, state };
}

async function commit(playerId: string, result: { state: PlayerState; events: GameEvent[] }) {
  await persistSaveState(playerId, result.state);
  revalidatePath("/play");
  return result.events;
}

/** Starts a brand new guest session for a visitor entering as the Seeker. */
export async function beginJourney(formData: FormData): Promise<void> {
  const rawName = formData.get("name");
  const trimmed = typeof rawName === "string" ? rawName.trim() : "";
  const name = (trimmed || "Seeker").slice(0, MAX_NAME_LENGTH);
  await beginPlayerSession(name);
  revalidatePath("/play");
}

export async function chooseOption(choiceId: string, optionId: string): Promise<GameEvent[]> {
  const { playerId, engine, state } = await loadEngineContext();
  return commit(playerId, engine.choose(state, choiceId, optionId));
}

export async function takeSceneExit(exitId: string): Promise<GameEvent[]> {
  const { playerId, engine, state } = await loadEngineContext();
  return commit(playerId, engine.takeExit(state, exitId));
}

export async function submitReflectionAnswer(
  promptId: string,
  answer: string,
): Promise<GameEvent[]> {
  const { playerId, engine, state } = await loadEngineContext();
  return commit(playerId, engine.submitReflection(state, promptId, answer));
}

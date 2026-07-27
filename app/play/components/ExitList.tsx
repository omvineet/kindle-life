"use client";

import type { GameEvent, SceneExit } from "@/engine/types";
import { takeSceneExit } from "../actions";
import { useGameAction } from "../hooks/useGameAction";

export function ExitList({
  exits,
  onEvents,
}: {
  exits: SceneExit[];
  onEvents: (events: GameEvent[]) => void;
}) {
  const { isPending, error, run } = useGameAction(onEvents);

  if (exits.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {exits.map((exit) => (
        <button
          key={exit.id}
          type="button"
          disabled={isPending}
          onClick={() => run(() => takeSceneExit(exit.id))}
          className="rounded-full border border-[#2f5d4a]/40 bg-transparent px-5 py-2 text-sm font-medium text-[#2f5d4a] transition hover:bg-[#2f5d4a] hover:text-[#f3e8d4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exit.label} →
        </button>
      ))}
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}

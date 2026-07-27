"use client";

import { useState, useTransition } from "react";
import type { GameEvent } from "@/engine/types";

/**
 * Shared plumbing for the small interactive pieces of a scene (choices,
 * reflections, exits): call a server action, forward any resulting events up
 * to the toast system, and surface a friendly error if something goes wrong.
 */
export function useGameAction(onEvents: (events: GameEvent[]) => void) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<GameEvent[]>) {
    setError(null);
    startTransition(async () => {
      try {
        const events = await action();
        onEvents(events);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      }
    });
  }

  return { isPending, error, run };
}

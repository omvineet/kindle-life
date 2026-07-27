"use client";

import { useState } from "react";
import {
  advanceDialogue,
  createDialogueCursor,
  currentLine,
  isDialogueComplete,
} from "@/engine/dialogue/dialogue-engine";
import type { GameEvent, JournalEntry, Scene, SceneExit } from "@/engine/types";
import { ChoiceCard } from "./ChoiceCard";
import { ExitList } from "./ExitList";
import { ReflectionCard } from "./ReflectionCard";

export function SceneCard({
  scene,
  exits,
  resolvedChoiceOptionId,
  journal,
  onEvents,
}: {
  scene: Scene;
  exits: SceneExit[];
  resolvedChoiceOptionId?: string;
  journal: JournalEntry[];
  onEvents: (events: GameEvent[]) => void;
}) {
  const [cursor, setCursor] = useState(() => createDialogueCursor(scene.dialogue));
  const line = currentLine(cursor);
  const dialogueDone = isDialogueComplete(cursor);
  const savedAnswer = scene.reflection
    ? journal.find((entry) => entry.promptId === scene.reflection?.id)?.answer
    : undefined;

  return (
    <div className="animate-fadein flex flex-col gap-6 rounded-3xl border border-[#2f5d4a]/15 bg-white/50 p-6 shadow-sm backdrop-blur sm:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#5a7266]">Scene</p>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#1c2b24]">
          {scene.title}
        </h2>
      </div>

      {line && (
        <div className="rounded-2xl bg-[#f3e8d4]/60 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#2f5d4a]">
            {line.speaker}
          </p>
          <p className="text-[#1c2b24]">{line.text}</p>
        </div>
      )}

      {!dialogueDone && (
        <button
          type="button"
          onClick={() => setCursor((current) => advanceDialogue(current))}
          className="self-start rounded-full border border-[#2f5d4a]/40 px-5 py-2 text-sm font-medium text-[#2f5d4a] transition hover:bg-[#2f5d4a] hover:text-[#f3e8d4]"
        >
          Continue
        </button>
      )}

      {dialogueDone && (
        <div className="flex flex-col gap-4">
          {scene.choice && (
            <ChoiceCard
              choice={scene.choice}
              resolvedOptionId={resolvedChoiceOptionId}
              onEvents={onEvents}
            />
          )}
          {scene.reflection && (
            <ReflectionCard
              reflection={scene.reflection}
              savedAnswer={savedAnswer}
              onEvents={onEvents}
            />
          )}
          <ExitList exits={exits} onEvents={onEvents} />
        </div>
      )}
    </div>
  );
}

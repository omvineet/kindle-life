"use client";

import { useState } from "react";
import type { GameEvent, ReflectionPrompt } from "@/engine/types";
import { submitReflectionAnswer } from "../actions";
import { useGameAction } from "../hooks/useGameAction";

export function ReflectionCard({
  reflection,
  savedAnswer,
  onEvents,
}: {
  reflection: ReflectionPrompt;
  savedAnswer?: string;
  onEvents: (events: GameEvent[]) => void;
}) {
  const [answer, setAnswer] = useState(savedAnswer ?? "");
  const [saved, setSaved] = useState(Boolean(savedAnswer));
  const { isPending, error, run } = useGameAction((events) => {
    setSaved(true);
    onEvents(events);
  });

  return (
    <div className="rounded-2xl border border-[#2f5d4a]/15 bg-white/70 p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#5a7266]">
        A moment to reflect
      </p>
      <p className="mb-3 text-base font-medium text-[#1c2b24]">{reflection.question}</p>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder={reflection.placeholder ?? "Write whatever comes to mind..."}
        rows={3}
        className="w-full rounded-xl border border-[#2f5d4a]/25 bg-white p-3 text-sm text-[#1c2b24] placeholder:text-[#5a7266] focus:border-[#2f5d4a] focus:outline-none"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || !answer.trim()}
          onClick={() => run(() => submitReflectionAnswer(reflection.id, answer))}
          className="rounded-full bg-[#2f5d4a] px-6 py-2 text-sm font-medium text-[#f3e8d4] transition hover:bg-[#264b3c] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved ? "Update journal entry" : "Save to journal"}
        </button>
        {saved && <span className="text-xs text-[#5a7266]">Saved — no one else will read this.</span>}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

"use client";

import type { Choice, GameEvent } from "@/engine/types";
import { chooseOption } from "../actions";
import { useGameAction } from "../hooks/useGameAction";

export function ChoiceCard({
  choice,
  resolvedOptionId,
  onEvents,
}: {
  choice: Choice;
  resolvedOptionId?: string;
  onEvents: (events: GameEvent[]) => void;
}) {
  const { isPending, error, run } = useGameAction(onEvents);
  const resolved = Boolean(resolvedOptionId);

  return (
    <div className="rounded-2xl border border-[#2f5d4a]/15 bg-white/70 p-5">
      <p className="mb-3 text-base font-medium text-[#1c2b24]">{choice.prompt}</p>
      <div className="flex flex-col gap-2">
        {choice.options.map((option) => {
          const isChosen = resolvedOptionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={isPending || resolved}
              onClick={() => run(() => chooseOption(choice.id, option.id))}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-not-allowed ${
                isChosen
                  ? "border-[#2f5d4a] bg-[#2f5d4a]/10 text-[#1c2b24]"
                  : "border-[#2f5d4a]/25 bg-white text-[#1c2b24] hover:border-[#2f5d4a] hover:bg-[#f3e8d4] disabled:opacity-60"
              }`}
            >
              {option.label}
              {isChosen && <span className="ml-2 text-xs text-[#5a7266]">— your path</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

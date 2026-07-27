"use client";

import { useState } from "react";
import type { VirtueProgress } from "@/engine/progression/progression-engine";
import type {
  Achievement,
  CollectibleItem,
  GameEvent,
  JournalEntry,
  Scene,
  SceneExit,
} from "@/engine/types";
import { EventToasts, type Toast } from "./EventToasts";
import { GrowthPanel } from "./GrowthPanel";
import { JournalDrawer } from "./JournalDrawer";
import { SceneCard } from "./SceneCard";

export interface GameShellProps {
  playerName: string;
  packTitle: string;
  scene: Scene;
  exits: SceneExit[];
  resolvedChoices: Record<string, string>;
  progression: VirtueProgress[];
  inventory: CollectibleItem[];
  unlockedAchievements: Achievement[];
  journal: JournalEntry[];
  packItems: CollectibleItem[];
  packAchievements: Achievement[];
}

type PanelKey = "growth" | "journal" | null;

function describeEvent(
  event: GameEvent,
  packItems: CollectibleItem[],
  packAchievements: Achievement[],
): string | null {
  switch (event.type) {
    case "item_gained": {
      const item = packItems.find((candidate) => candidate.id === event.itemId);
      return item ? `A keepsake, kept: ${item.title}` : null;
    }
    case "achievement_unlocked": {
      const achievement = packAchievements.find((candidate) => candidate.id === event.achievementId);
      return achievement ? `Milestone reached: ${achievement.title}` : null;
    }
    case "level_up":
      return `Your ${event.trackId} has grown — you are now a ${event.title}.`;
    case "quest_completed":
      return "A quest comes full circle.";
    default:
      return null;
  }
}

export function GameShell({
  playerName,
  packTitle,
  scene,
  exits,
  resolvedChoices,
  progression,
  inventory,
  unlockedAchievements,
  journal,
  packItems,
  packAchievements,
}: GameShellProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [panel, setPanel] = useState<PanelKey>(null);

  function handleEvents(events: GameEvent[]) {
    const messages = events
      .map((event) => describeEvent(event, packItems, packAchievements))
      .filter((message): message is string => Boolean(message));
    if (messages.length === 0) return;
    setToasts((current) => [
      ...current,
      ...messages.map((message, index) => ({ id: `${Date.now()}-${index}-${message}`, message })),
    ]);
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <EventToasts toasts={toasts} onDismiss={dismissToast} />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2f5d4a]/10 px-6 py-4 sm:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#5a7266]">{packTitle}</p>
          <p className="font-[family-name:var(--font-display)] text-lg text-[#1c2b24]">
            {playerName}, the Seeker
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPanel((current) => (current === "growth" ? null : "growth"))}
            aria-pressed={panel === "growth"}
            className="rounded-full border border-[#2f5d4a]/30 px-4 py-2 text-xs font-medium text-[#2f5d4a] transition hover:bg-[#2f5d4a]/10"
          >
            Your growth
          </button>
          <button
            type="button"
            onClick={() => setPanel((current) => (current === "journal" ? null : "journal"))}
            aria-pressed={panel === "journal"}
            className="rounded-full border border-[#2f5d4a]/30 px-4 py-2 text-xs font-medium text-[#2f5d4a] transition hover:bg-[#2f5d4a]/10"
          >
            Journal
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        {panel === "growth" && <GrowthPanel progression={progression} />}
        {panel === "journal" && <JournalDrawer journal={journal} />}

        <SceneCard
          key={scene.id}
          scene={scene}
          exits={exits}
          resolvedChoiceOptionId={scene.choice ? resolvedChoices[scene.choice.id] : undefined}
          journal={journal}
          onEvents={handleEvents}
        />

        {(inventory.length > 0 || unlockedAchievements.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {inventory.map((item) => (
              <span
                key={item.id}
                title={item.description}
                className="rounded-full bg-white/60 px-3 py-1 text-xs text-[#2f5d4a]"
              >
                {item.title}
              </span>
            ))}
            {unlockedAchievements.map((achievement) => (
              <span
                key={achievement.id}
                title={achievement.description}
                className="rounded-full bg-[#2f5d4a]/10 px-3 py-1 text-xs font-medium text-[#2f5d4a]"
              >
                ✦ {achievement.title}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

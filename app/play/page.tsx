import { GameEngine, loadContentPack } from "@/engine";
import { getCurrentPlayer } from "@/lib/game/session";
import { loadOrCreateSaveState } from "@/lib/game/save-repository";
import { BeginJourneyForm } from "./components/BeginJourneyForm";
import { GameShell } from "./components/GameShell";
import { ACTIVE_PACK_ID } from "./constants";

export default async function PlayPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    return (
      <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#f3e8d4_0%,_#e8f0ea_45%,_#d7e6ef_100%)]"
        />
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#2f5d4a]">
            The Quiet Garden
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#1c2b24]">
            Enter as the Seeker
          </h1>
          <p className="text-[#3d5248]">
            There is no wrong way to begin. Give yourself a name, and step through the gate.
          </p>
          <BeginJourneyForm />
        </div>
      </div>
    );
  }

  const pack = loadContentPack(ACTIVE_PACK_ID);
  const engine = new GameEngine(pack);
  const state = await loadOrCreateSaveState(pack, player.id, player.displayName);

  const scene = engine.getCurrentScene(state);
  const exits = engine.getAvailableExits(state);
  const progression = engine.getProgressionSummary(state);
  const inventory = engine.listInventory(state);
  const unlockedAchievements = engine.listAchievements(state);
  const journal = engine.getJournalEntries(state);

  return (
    <GameShell
      playerName={player.displayName}
      packTitle={pack.title}
      scene={scene}
      exits={exits}
      resolvedChoices={state.resolvedChoices}
      progression={progression}
      inventory={inventory}
      unlockedAchievements={unlockedAchievements}
      journal={journal}
      packItems={pack.items}
      packAchievements={pack.achievements}
    />
  );
}

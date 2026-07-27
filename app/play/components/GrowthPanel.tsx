import { PROGRESSION_LEVELS, type VirtueProgress } from "@/engine/progression/progression-engine";

function levelProgressPercent(entry: VirtueProgress): number {
  if (entry.pointsToNextLevel === null) return 100;
  const currentLevel = PROGRESSION_LEVELS.find((level) => level.level === entry.level);
  const nextLevel = PROGRESSION_LEVELS.find((level) => level.level === entry.level + 1);
  if (!currentLevel || !nextLevel) return 100;
  const band = nextLevel.minPoints - currentLevel.minPoints;
  if (band <= 0) return 100;
  const progressInBand = entry.points - currentLevel.minPoints;
  return Math.min(100, Math.max(0, Math.round((progressInBand / band) * 100)));
}

export function GrowthPanel({ progression }: { progression: VirtueProgress[] }) {
  if (progression.length === 0) return null;

  return (
    <div className="animate-fadein flex flex-col gap-4 rounded-2xl border border-[#2f5d4a]/15 bg-white/70 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[#5a7266]">
        Your inner compass — private to you, never compared to anyone else
      </p>
      {progression.map((entry) => (
        <div key={entry.track.id}>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-medium text-[#1c2b24]">{entry.track.title}</span>
            <span className="text-xs text-[#5a7266]">{entry.title}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#2f5d4a]/10">
            <div
              className="h-2 rounded-full bg-[#2f5d4a] transition-all duration-500"
              style={{ width: `${levelProgressPercent(entry)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

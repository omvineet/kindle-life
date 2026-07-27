/**
 * Progression engine — the "role-playing" heart of the Seeker's journey.
 *
 * Each content pack defines a handful of virtue tracks (e.g. Compassion,
 * Awareness, Courage, Wisdom). Choices, quests, reflections, and collectibles
 * can award points to one or more tracks. Points cross simple thresholds
 * into levels with narrative titles.
 *
 * Hard rules (see docs/VISION.md "Non-Goals"):
 * - This is entirely individual. There is no aggregate/global score, no
 *   leaderboard, and nothing here is ever compared between players.
 * - Levels unlock narrative titles and flavor, never mechanical power or
 *   difficulty changes.
 */

import type { ContentPack, GameEvent, PlayerState, VirtueTrack } from "../types";

export interface ProgressionLevel {
  level: number;
  title: string;
  minPoints: number;
}

/** Simple, generic tiers — deliberately book-agnostic (no lore-specific naming). */
export const PROGRESSION_LEVELS: readonly ProgressionLevel[] = [
  { level: 1, title: "Novice", minPoints: 0 },
  { level: 2, title: "Seeker", minPoints: 3 },
  { level: 3, title: "Adept", minPoints: 7 },
  { level: 4, title: "Sage", minPoints: 12 },
];

export function getLevelForPoints(points: number): ProgressionLevel {
  let current = PROGRESSION_LEVELS[0];
  for (const level of PROGRESSION_LEVELS) {
    if (points >= level.minPoints) {
      current = level;
    }
  }
  return current;
}

export function getTrackPoints(state: PlayerState, trackId: string): number {
  return state.progression[trackId] ?? 0;
}

export interface AwardPointsResult {
  state: PlayerState;
  events: GameEvent[];
}

/** Awards points to one or more virtue tracks, emitting a `level_up` event per track that crosses a threshold. */
export function awardPoints(
  pack: ContentPack,
  state: PlayerState,
  awards: Record<string, number>,
): AwardPointsResult {
  let next = state;
  const events: GameEvent[] = [];

  for (const [trackId, amount] of Object.entries(awards)) {
    if (!pack.virtueTracks.some((track) => track.id === trackId)) {
      throw new Error(`Unknown virtue track: ${trackId}`);
    }
    const before = getTrackPoints(next, trackId);
    const after = before + amount;
    next = { ...next, progression: { ...next.progression, [trackId]: after } };

    const beforeLevel = getLevelForPoints(before);
    const afterLevel = getLevelForPoints(after);
    if (afterLevel.level > beforeLevel.level) {
      events.push({ type: "level_up", trackId, level: afterLevel.level, title: afterLevel.title });
    }
  }

  return { state: next, events };
}

export interface VirtueProgress {
  track: VirtueTrack;
  points: number;
  level: number;
  title: string;
  /** Points still needed to reach the next level, or null if already at the highest level. */
  pointsToNextLevel: number | null;
}

/** A private, personal growth summary — for the player's own eyes only. */
export function getProgressionSummary(pack: ContentPack, state: PlayerState): VirtueProgress[] {
  return pack.virtueTracks.map((track) => {
    const points = getTrackPoints(state, track.id);
    const level = getLevelForPoints(points);
    const nextLevel = PROGRESSION_LEVELS.find((candidate) => candidate.level === level.level + 1);
    return {
      track,
      points,
      level: level.level,
      title: level.title,
      pointsToNextLevel: nextLevel ? nextLevel.minPoints - points : null,
    };
  });
}

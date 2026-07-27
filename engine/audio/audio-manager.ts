/**
 * Audio manager — framework-agnostic state for the current scene's music.
 * Deliberately thin: it tracks *what should be playing*, not how to play it.
 * A React hook (or any other renderer) reads this state and drives an actual
 * `<audio>` element / Web Audio graph.
 */

export type AudioPlaybackStatus = "idle" | "playing" | "paused";

export interface AudioManagerState {
  /** Asset key of the current track, resolved via lib/assets.ts by the caller. */
  currentTrackKey?: string;
  status: AudioPlaybackStatus;
  volume: number;
}

const DEFAULT_VOLUME = 0.6;

export function createAudioManagerState(): AudioManagerState {
  return { status: "idle", volume: DEFAULT_VOLUME };
}

export function playTrack(state: AudioManagerState, trackKey: string): AudioManagerState {
  return { ...state, currentTrackKey: trackKey, status: "playing" };
}

export function pauseTrack(state: AudioManagerState): AudioManagerState {
  if (state.status !== "playing") return state;
  return { ...state, status: "paused" };
}

export function resumeTrack(state: AudioManagerState): AudioManagerState {
  if (state.status !== "paused") return state;
  return { ...state, status: "playing" };
}

export function stopTrack(state: AudioManagerState): AudioManagerState {
  return { ...state, currentTrackKey: undefined, status: "idle" };
}

export function setVolume(state: AudioManagerState, volume: number): AudioManagerState {
  const clamped = Math.min(1, Math.max(0, volume));
  return { ...state, volume: clamped };
}

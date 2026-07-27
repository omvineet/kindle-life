import { describe, expect, it } from "vitest";
import {
  createAudioManagerState,
  pauseTrack,
  playTrack,
  resumeTrack,
  setVolume,
  stopTrack,
} from "./audio-manager";

describe("audio-manager", () => {
  it("starts idle with a default volume", () => {
    const state = createAudioManagerState();
    expect(state.status).toBe("idle");
    expect(state.currentTrackKey).toBeUndefined();
    expect(state.volume).toBeGreaterThan(0);
  });

  it("plays, pauses, and resumes a track", () => {
    let state = playTrack(createAudioManagerState(), "audio/theme.mp3");
    expect(state).toMatchObject({ status: "playing", currentTrackKey: "audio/theme.mp3" });

    state = pauseTrack(state);
    expect(state.status).toBe("paused");

    state = resumeTrack(state);
    expect(state.status).toBe("playing");
  });

  it("ignores pause/resume when not applicable", () => {
    const idle = createAudioManagerState();
    expect(pauseTrack(idle)).toBe(idle);

    const playing = playTrack(createAudioManagerState(), "audio/theme.mp3");
    expect(resumeTrack(playing)).toBe(playing);
  });

  it("stops a track, clearing the current key", () => {
    const playing = playTrack(createAudioManagerState(), "audio/theme.mp3");
    const stopped = stopTrack(playing);
    expect(stopped).toMatchObject({ status: "idle", currentTrackKey: undefined });
  });

  it("clamps volume to the 0..1 range", () => {
    expect(setVolume(createAudioManagerState(), 2).volume).toBe(1);
    expect(setVolume(createAudioManagerState(), -1).volume).toBe(0);
    expect(setVolume(createAudioManagerState(), 0.3).volume).toBe(0.3);
  });
});

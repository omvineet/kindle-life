/**
 * Public API of the generic game engine. Platform and content-authoring code
 * should import from here (or from `engine/content/content-loader`) rather
 * than reaching into individual subsystem files.
 */

export * from "./types";

export { GameEngine, type EngineResult } from "./engine";

export { loadContentPack, clearContentCache } from "./content/content-loader";

export {
  createInitialPlayerState,
  serializePlayerState,
  deserializePlayerState,
  type SerializedPlayerState,
} from "./save/save-engine";

export {
  createDialogueCursor,
  currentLine,
  hasMoreLines,
  advanceDialogue,
  isDialogueComplete,
  type DialogueCursor,
} from "./dialogue/dialogue-engine";

export { applyEffect, type EffectResult } from "./effects/effect-engine";

export { addItem, hasItem, listInventory, type AddItemResult } from "./inventory/inventory-engine";

export {
  unlockAchievement,
  hasAchievement,
  listAchievements,
  type UnlockAchievementResult,
} from "./achievements/achievement-engine";

export {
  getQuestProgress,
  startQuest,
  completeObjective,
  type StartQuestResult,
  type CompleteObjectiveResult,
} from "./quest/quest-engine";

export {
  recordReflection,
  addJournalNote,
  getJournalEntries,
  hasReflected,
} from "./journal/reflection-journal";

export {
  PROGRESSION_LEVELS,
  getLevelForPoints,
  getTrackPoints,
  awardPoints,
  getProgressionSummary,
  type ProgressionLevel,
  type AwardPointsResult,
  type VirtueProgress,
} from "./progression/progression-engine";

export {
  getScene,
  getCurrentScene,
  getAvailableExits,
  canTakeExit,
} from "./scene/scene-navigation";

export {
  createAudioManagerState,
  playTrack,
  pauseTrack,
  resumeTrack,
  stopTrack,
  setVolume,
  type AudioManagerState,
  type AudioPlaybackStatus,
} from "./audio/audio-manager";

export {
  getDefaultSceneTransition,
  withDuration,
  type SceneTransition,
  type TransitionKind,
} from "./animation/animation-manager";

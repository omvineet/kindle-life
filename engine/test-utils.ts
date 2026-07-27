/**
 * Shared fixtures for engine unit tests. Not a real content pack — just
 * enough shape to exercise every subsystem in isolation.
 */

import type { ContentPack, PlayerState } from "./types";

export function makeTestPack(overrides: Partial<ContentPack> = {}): ContentPack {
  const base: ContentPack = {
    id: "test-pack",
    title: "Test Pack",
    version: "0.0.1",
    entryChapterId: "chapter-1",
    chapterIds: ["chapter-1"],
    virtueTracks: [
      { id: "compassion", title: "Compassion" },
      { id: "awareness", title: "Awareness" },
    ],
    quests: [
      {
        id: "find-the-grove",
        title: "Find the Grove",
        description: "Locate the quiet grove.",
        objectives: [
          { id: "leave-hub", label: "Step outside" },
          { id: "reach-grove", label: "Reach the grove" },
        ],
      },
    ],
    achievements: [
      { id: "first-steps", title: "First Steps", description: "Began the journey." },
    ],
    items: [
      { id: "lotus-petal", title: "Lotus Petal", description: "A small reminder of stillness." },
    ],
    chapters: {
      "chapter-1": {
        id: "chapter-1",
        title: "Chapter 1",
        order: 1,
        entrySceneId: "hub",
        sceneIds: ["hub", "grove"],
      },
    },
    scenes: {
      hub: {
        id: "hub",
        title: "The Hub",
        dialogue: [{ speaker: "Guide", text: "Welcome, Seeker." }],
        choice: {
          id: "hub-choice",
          prompt: "What do you do?",
          options: [
            {
              id: "reflect",
              label: "Sit and reflect",
              effect: { awardPoints: { awareness: 2 } },
            },
            {
              id: "help",
              label: "Help a stranger",
              effect: { awardPoints: { compassion: 2 }, addItems: ["lotus-petal"] },
            },
          ],
        },
        reflection: { id: "hub-reflection", question: "What do you notice?" },
        reflectionEffect: { awardPoints: { awareness: 1 } },
        exits: [{ id: "to-grove", label: "Walk to the grove", targetSceneId: "grove" }],
      },
      grove: {
        id: "grove",
        title: "The Grove",
        dialogue: [{ speaker: "Guide", text: "You made it." }],
        onEnter: {
          completeObjectives: [{ questId: "find-the-grove", objectiveId: "reach-grove" }],
        },
        exits: [{ id: "to-hub", label: "Return to the hub", targetSceneId: "hub" }],
      },
    },
  };

  return { ...base, ...overrides };
}

export function makeTestState(overrides: Partial<PlayerState> = {}): PlayerState {
  const base: PlayerState = {
    name: "Test Seeker",
    packId: "test-pack",
    sceneId: "hub",
    flags: {},
    inventory: [],
    journal: [],
    achievements: [],
    quests: {},
    progression: {},
    resolvedChoices: {},
    updatedAt: new Date(0).toISOString(),
  };
  return { ...base, ...overrides };
}

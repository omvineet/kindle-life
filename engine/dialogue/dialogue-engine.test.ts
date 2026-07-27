import { describe, expect, it } from "vitest";
import {
  advanceDialogue,
  createDialogueCursor,
  currentLine,
  hasMoreLines,
  isDialogueComplete,
} from "./dialogue-engine";

const lines = [
  { speaker: "Guide", text: "Welcome." },
  { speaker: "Guide", text: "Look around you." },
  { speaker: "Seeker", text: "Where am I?" },
];

describe("dialogue-engine", () => {
  it("starts at the first line", () => {
    const cursor = createDialogueCursor(lines);
    expect(currentLine(cursor)).toEqual(lines[0]);
    expect(isDialogueComplete(cursor)).toBe(false);
  });

  it("advances one line at a time", () => {
    let cursor = createDialogueCursor(lines);
    cursor = advanceDialogue(cursor);
    expect(currentLine(cursor)).toEqual(lines[1]);
    expect(hasMoreLines(cursor)).toBe(true);
  });

  it("reports completion on the last line and stops advancing", () => {
    let cursor = createDialogueCursor(lines);
    cursor = advanceDialogue(cursor);
    cursor = advanceDialogue(cursor);
    expect(currentLine(cursor)).toEqual(lines[2]);
    expect(isDialogueComplete(cursor)).toBe(true);

    const stayed = advanceDialogue(cursor);
    expect(stayed).toEqual(cursor);
  });

  it("treats an empty line list as already complete", () => {
    const cursor = createDialogueCursor([]);
    expect(isDialogueComplete(cursor)).toBe(true);
    expect(currentLine(cursor)).toBeUndefined();
  });
});

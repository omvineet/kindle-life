/**
 * Dialogue engine — a tiny cursor over a scene's dialogue lines. Dialogue
 * position is ephemeral UI state (not persisted): reopening a scene simply
 * replays its lines from the start.
 */

import type { DialogueLine } from "../types";

export interface DialogueCursor {
  lines: DialogueLine[];
  index: number;
}

export function createDialogueCursor(lines: DialogueLine[]): DialogueCursor {
  return { lines, index: 0 };
}

export function currentLine(cursor: DialogueCursor): DialogueLine | undefined {
  return cursor.lines[cursor.index];
}

export function hasMoreLines(cursor: DialogueCursor): boolean {
  return cursor.index < cursor.lines.length - 1;
}

export function advanceDialogue(cursor: DialogueCursor): DialogueCursor {
  if (!hasMoreLines(cursor)) return cursor;
  return { ...cursor, index: cursor.index + 1 };
}

export function isDialogueComplete(cursor: DialogueCursor): boolean {
  return cursor.lines.length === 0 || cursor.index >= cursor.lines.length - 1;
}

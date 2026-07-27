import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { clearContentCache, loadContentPack } from "./content-loader";

const FIXTURES_ROOT = path.join(process.cwd(), "engine", "content", "__fixtures__");

describe("content-loader", () => {
  beforeEach(() => {
    clearContentCache();
  });

  it("loads and validates a well-formed pack", () => {
    const pack = loadContentPack("valid-pack", FIXTURES_ROOT);
    expect(pack.id).toBe("valid-pack");
    expect(Object.keys(pack.chapters)).toEqual(["chapter-1"]);
    expect(Object.keys(pack.scenes).sort()).toEqual(["grove", "hub"]);
    expect(pack.scenes.hub.choice?.options).toHaveLength(2);
  });

  it("caches a loaded pack across calls", () => {
    const first = loadContentPack("valid-pack", FIXTURES_ROOT);
    const second = loadContentPack("valid-pack", FIXTURES_ROOT);
    expect(second).toBe(first);
  });

  it("rejects a manifest that fails schema validation", () => {
    expect(() => loadContentPack("bad-manifest", FIXTURES_ROOT)).toThrow(/manifest/i);
  });

  it("rejects a scene exit pointing at a scene that does not exist", () => {
    expect(() => loadContentPack("dangling-exit", FIXTURES_ROOT)).toThrow(/unknown scene/i);
  });

  it("rejects a pack whose manifest id does not match its folder name", () => {
    expect(() => loadContentPack("id-mismatch", FIXTURES_ROOT)).toThrow(/id mismatch/i);
  });

  it("rejects a manifest whose entryChapterId does not resolve", () => {
    expect(() => loadContentPack("missing-entry-chapter", FIXTURES_ROOT)).toThrow(/entryChapterId/);
  });

  it("rejects an effect that awards points to an undefined virtue track", () => {
    expect(() => loadContentPack("unknown-virtue-track", FIXTURES_ROOT)).toThrow(/virtue track/i);
  });

  it("throws a clear error for a pack that does not exist on disk", () => {
    expect(() => loadContentPack("does-not-exist", FIXTURES_ROOT)).toThrow(/not found/i);
  });

  it("loads the real content/demo pack from its default location", () => {
    const pack = loadContentPack("demo");
    expect(pack.title).toBe("The Quiet Garden (Demo)");
    expect(pack.virtueTracks.map((track) => track.id).sort()).toEqual(["awareness", "compassion"]);
    expect(Object.keys(pack.scenes).sort()).toEqual(["bench", "gate", "heart", "stream"]);
  });
});

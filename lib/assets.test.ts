import { afterEach, describe, expect, it } from "vitest";
import {
  packBlobPath,
  resolveAssetUrl,
  teacherBlobPath,
  userBlobPath,
} from "@/lib/assets";

describe("resolveAssetUrl", () => {
  const previousBase = process.env.CONTENT_ASSET_BASE;

  afterEach(() => {
    if (previousBase === undefined) {
      delete process.env.CONTENT_ASSET_BASE;
    } else {
      process.env.CONTENT_ASSET_BASE = previousBase;
    }
  });

  it("resolves to git-shipped public path when CONTENT_ASSET_BASE is unset", () => {
    delete process.env.CONTENT_ASSET_BASE;
    expect(resolveAssetUrl("kindle-life", "scenes/grove.webp")).toBe(
      "/content/kindle-life/assets/scenes/grove.webp",
    );
  });

  it("resolves to Blob CDN base when CONTENT_ASSET_BASE is set", () => {
    process.env.CONTENT_ASSET_BASE = "https://example.public.blob.vercel-storage.com";
    expect(resolveAssetUrl("kindle-life", "audio/theme.mp3")).toBe(
      "https://example.public.blob.vercel-storage.com/packs/kindle-life/latest/audio/theme.mp3",
    );
  });

  it("uses an explicit pack version on Blob paths", () => {
    process.env.CONTENT_ASSET_BASE = "https://cdn.example";
    expect(
      resolveAssetUrl("kindle-life", "/audio/theme.mp3", { version: "v1" }),
    ).toBe("https://cdn.example/packs/kindle-life/v1/audio/theme.mp3");
  });

  it("rejects empty packId or key", () => {
    expect(() => resolveAssetUrl("", "x")).toThrow(/packId/);
    expect(() => resolveAssetUrl("pack", "")).toThrow(/key/);
  });
});

describe("blob path helpers", () => {
  it("builds pack, user, and teacher prefixes", () => {
    expect(packBlobPath("kindle-life", "audio/a.mp3", "v1")).toBe(
      "packs/kindle-life/v1/audio/a.mp3",
    );
    expect(userBlobPath("u1", "avatar.webp")).toBe("users/u1/avatar.webp");
    expect(teacherBlobPath("t1", "handout.pdf")).toBe(
      "teachers/t1/handout.pdf",
    );
  });
});

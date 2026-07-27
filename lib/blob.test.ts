import { describe, expect, it } from "vitest";
import { isBlobConfigured } from "@/lib/blob";

describe("isBlobConfigured", () => {
  it("returns a boolean without throwing", () => {
    expect(typeof isBlobConfigured()).toBe("boolean");
  });
});

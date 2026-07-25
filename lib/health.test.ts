import { describe, expect, it } from "vitest";
import type { HealthStatus } from "@/lib/health";

function isHealthy(status: HealthStatus): boolean {
  return status.ok === true && status.db === true;
}

describe("health status shape", () => {
  it("treats ok+db as healthy", () => {
    expect(isHealthy({ ok: true, db: true })).toBe(true);
  });

  it("treats db failure as unhealthy", () => {
    expect(isHealthy({ ok: false, db: false, error: "connection refused" })).toBe(
      false,
    );
  });
});

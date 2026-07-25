import { prisma } from "@/lib/db";

export type HealthStatus = {
  ok: boolean;
  db: boolean;
  error?: string;
};

export async function checkHealth(): Promise<HealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, db: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return { ok: false, db: false, error: message };
  }
}

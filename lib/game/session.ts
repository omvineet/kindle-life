import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { Player } from "@prisma/client";

/**
 * Anonymous guest sessions — no login yet (see docs/ARCHITECTURE.md's "Later"
 * platform phase). A signed httpOnly cookie holds an opaque token that maps
 * to a `Player` row. Reading the session works anywhere; creating one only
 * works in a Server Action or Route Handler (Next.js only allows setting
 * cookies there — see node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md).
 */

const SESSION_COOKIE = "seeker_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function getCurrentPlayer(): Promise<Player | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return prisma.player.findUnique({ where: { token } });
}

/** Creates a new guest Player and sets their session cookie. Server Action / Route Handler only. */
export async function beginPlayerSession(displayName: string): Promise<Player> {
  const token = randomUUID();
  const player = await prisma.player.create({
    data: { token, displayName },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return player;
}

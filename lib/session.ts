import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
});

/** The signed-in user's full profile row, or a redirect to sign-in. */
export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/sign-in");
  return user;
});

/** For route handlers: the user id or null (callers return 401). */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}

export async function getGoogleAccount(userId: string) {
  return db.account.findFirst({ where: { userId, providerId: "google" }, orderBy: { updatedAt: "desc" } });
}

export function hasGmailSend(scope: string | null | undefined): boolean {
  return Boolean(scope?.includes("gmail.send"));
}

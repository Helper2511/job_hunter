import "server-only";
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Run a handler for the signed-in user, or answer 401. */
export async function withUser(handler: (userId: string) => Promise<Response>): Promise<Response> {
  const userId = await getUserId();
  if (!userId) return errorJson("Please sign in again.", 401);
  try {
    return await handler(userId);
  } catch (err) {
    console.error(err);
    return errorJson("Something went wrong on our side. Try again.", 500);
  }
}

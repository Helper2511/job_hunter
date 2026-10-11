import "server-only";
import { EVENTS, inngest } from "@/inngest/client";

/** Send a background event; returns false when Inngest is not reachable so callers can run inline. */
export async function sendEvent(name: (typeof EVENTS)[keyof typeof EVENTS], data: Record<string, unknown>): Promise<boolean> {
  if (process.env.NODE_ENV === "production" && !process.env.INNGEST_EVENT_KEY) return false;
  try {
    await inngest.send({ name, data });
    return true;
  } catch {
    return false;
  }
}

export { EVENTS };

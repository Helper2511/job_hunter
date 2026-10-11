import { createHmac } from "node:crypto";
import type { BrowserContext } from "@playwright/test";

const token = process.env.E2E_SESSION_TOKEN ?? "e2e-session-token";
const secret = process.env.BETTER_AUTH_SECRET;

/** Signed-in tests run when the server shares BETTER_AUTH_SECRET and the database was seeded. */
export const canSignIn = Boolean(secret && process.env.E2E_SEED === "1");

/** Better Auth signs the session cookie: "<token>.<base64 HMAC-SHA256>". */
export async function signIn(context: BrowserContext, baseURL: string) {
  const signature = createHmac("sha256", secret!).update(token).digest("base64");
  await context.addCookies([{ name: "better-auth.session_token", value: encodeURIComponent(`${token}.${signature}`), url: baseURL }]);
}

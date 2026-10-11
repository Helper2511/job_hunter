import "server-only";
import { BOT_USER_AGENT } from "@/lib/constants";
import { db } from "@/lib/db";
import { isPathAllowed, parseRobots } from "@/lib/robots";

/**
 * Polite fetching for career pages and public job-board endpoints:
 * identifies the bot, respects robots.txt, waits 1 second between requests
 * to the same domain and caches responses for 12 hours.
 */

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;
const TIMEOUT_MS = 8000;
const MAX_BODY = 2_000_000;

const lastRequestAt = new Map<string, number>();
const robotsCache = new Map<string, { rules: string[]; at: number }>();

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function throttle(host: string) {
  const last = lastRequestAt.get(host) ?? 0;
  const wait = last + MIN_INTERVAL_MS - Date.now();
  lastRequestAt.set(host, Math.max(Date.now(), last + MIN_INTERVAL_MS));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function allowedByRobots(url: URL): Promise<boolean> {
  const origin = url.origin;
  const cached = robotsCache.get(origin);
  let rules = cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.rules : null;
  if (!rules) {
    try {
      const res = await fetch(`${origin}/robots.txt`, {
        headers: { "User-Agent": BOT_USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      rules = res.ok ? parseRobots(await res.text()) : [];
    } catch {
      rules = [];
    }
    robotsCache.set(origin, { rules, at: Date.now() });
  }
  return isPathAllowed(url.pathname + url.search, rules);
}

async function readCache(url: string) {
  try {
    const row = await db.fetchCache.findUnique({ where: { url } });
    if (row && Date.now() - row.fetchedAt.getTime() < CACHE_TTL_MS) return row;
  } catch {
    // Cache is best effort.
  }
  return null;
}

async function writeCache(url: string, status: number, body: string) {
  try {
    await db.fetchCache.upsert({
      where: { url },
      create: { url, status, body },
      update: { status, body, fetchedAt: new Date() },
    });
  } catch {
    // Cache is best effort.
  }
}

export interface PoliteFetchOptions {
  /** Public JSON endpoints are APIs meant for this use; robots.txt applies to pages. */
  checkRobots?: boolean;
  accept?: string;
  bypassCache?: boolean;
}

export async function politeFetch(
  input: string,
  opts: PoliteFetchOptions = {},
): Promise<{ status: number; body: string; url: string }> {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol)) throw new FetchError("Only web addresses are supported");

  if (!opts.bypassCache) {
    const cached = await readCache(url.toString());
    if (cached) return { status: cached.status, body: cached.body, url: url.toString() };
  }

  if (opts.checkRobots !== false && !(await allowedByRobots(url))) {
    throw new FetchError("This page asks bots not to read it", 403);
  }

  await throttle(url.host);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": BOT_USER_AGENT,
        Accept: opts.accept ?? "text/html,application/json;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new FetchError("Could not reach this page");
  }
  const text = (await res.text()).slice(0, MAX_BODY);
  if (res.ok) await writeCache(url.toString(), res.status, text);
  return { status: res.status, body: text, url: res.url || url.toString() };
}

export async function politeJson<T>(url: string, opts: PoliteFetchOptions = {}): Promise<T> {
  const res = await politeFetch(url, { checkRobots: false, accept: "application/json", ...opts });
  if (res.status >= 400) throw new FetchError(`Request failed (${res.status})`, res.status);
  try {
    return JSON.parse(res.body) as T;
  } catch {
    throw new FetchError("Unexpected response");
  }
}

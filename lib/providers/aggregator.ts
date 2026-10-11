import "server-only";
import { normalizePosting } from "@/lib/ats/types";
import type { JobProvider, JobQuery, NormalizedJob } from "./types";

/**
 * Optional licensed jobs-data feed. Set JOBS_DATA_API_URL and JOBS_DATA_API_KEY;
 * the endpoint is expected to accept `q` and `location` and return
 * `{ jobs: { title, company, location, url, description?, postedAt? }[] }`.
 * Swap this file to change vendors; nothing else depends on it.
 */
export const aggregatorProvider: JobProvider = {
  id: "aggregator",
  async search(q: JobQuery): Promise<NormalizedJob[]> {
    const base = process.env.JOBS_DATA_API_URL;
    const key = process.env.JOBS_DATA_API_KEY;
    if (!base || !key) return [];
    const params = new URLSearchParams({ q: q.keywords });
    if (q.locations?.[0]) params.set("location", q.locations[0]);
    const res = await fetch(`${base}?${params}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      jobs?: { title: string; company: string; location?: string; url: string; description?: string; postedAt?: string }[];
    };
    return (data.jobs ?? []).map((j) =>
      normalizePosting(
        { title: j.title, url: j.url, location: j.location, description: j.description, postedAt: j.postedAt },
        { name: j.company },
        "aggregator",
      ),
    );
  },
};

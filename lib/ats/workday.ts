import { politeJson } from "@/lib/http";
import type { RawPosting } from "./types";

/**
 * Workday career sites answer searches at their public "cxs" endpoint:
 * POST https://{tenant}.{wdN}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
 * The token is "{tenant}.{wdN}/{site}".
 */

interface WorkdayResponse {
  total?: number;
  jobPostings?: {
    title: string;
    externalPath: string;
    locationsText?: string;
    postedOn?: string;
    remoteType?: string;
    bulletFields?: string[];
  }[];
}

function parts(token: string) {
  const [host, site] = token.split("/");
  const [tenant, wd] = host.split(".");
  if (!tenant || !wd || !site) throw new Error(`Bad Workday token: ${token}`);
  return { tenant, wd, site, origin: `https://${tenant}.${wd}.myworkdayjobs.com` };
}

export function workdayBoardUrl(token: string): string {
  const { origin, site } = parts(token);
  return `${origin}/${site}`;
}

/** "Posted Today", "Posted Yesterday", "Posted 3 Days Ago", "Posted 30+ Days Ago". */
export function workdayPostedOn(text: string | undefined, now = new Date()): Date | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const day = 86_400_000;
  if (t.includes("today")) return now;
  if (t.includes("yesterday")) return new Date(now.getTime() - day);
  const n = t.match(/(\d+)\+?\s*days?/);
  return n ? new Date(now.getTime() - Number(n[1]) * day) : null;
}

export function mapWorkday(data: WorkdayResponse, token: string, now = new Date()): RawPosting[] {
  const { origin, site } = parts(token);
  return (data.jobPostings ?? []).map((j) => {
    const url = `${origin}/${site}${j.externalPath}`;
    // "3 Locations" is a count, not a place; leave the location for the detail page.
    const location = j.locationsText && !/^\d+\s+locations?$/i.test(j.locationsText) ? j.locationsText : null;
    return {
      title: j.title,
      url,
      applyUrl: url,
      location,
      atsMode: j.remoteType ?? null,
      postedAt: workdayPostedOn(j.postedOn, now),
    };
  });
}

export async function fetchWorkday(token: string, maxPages = 10): Promise<RawPosting[]> {
  const { tenant, site, origin } = parts(token);
  const out: RawPosting[] = [];
  const limit = 20; // the endpoint caps a page at 20
  for (let page = 0; page < maxPages; page++) {
    const data = await politeJson<WorkdayResponse>(`${origin}/wday/cxs/${tenant}/${site}/jobs`, {
      jsonBody: { appliedFacets: {}, limit, offset: page * limit, searchText: "" },
    });
    out.push(...mapWorkday(data, token));
    if (!data.jobPostings?.length || (page + 1) * limit >= (data.total ?? 0)) break;
  }
  return out;
}

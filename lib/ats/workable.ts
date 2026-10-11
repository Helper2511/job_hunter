import { politeJson } from "@/lib/http";
import type { RawPosting } from "./types";

interface WorkableResponse {
  name?: string;
  jobs: {
    title: string;
    shortcode: string;
    url?: string;
    shortlink?: string;
    application_url?: string;
    city?: string;
    state?: string;
    country?: string;
    telecommuting?: boolean;
    workplace?: string; // on_site | hybrid | remote
    published_on?: string;
    created_at?: string;
    experience?: string;
    description?: string;
    locations?: { city?: string; region?: string; country?: string }[];
  }[];
}

export function mapWorkable(data: WorkableResponse, account: string): RawPosting[] {
  return (data.jobs ?? []).map((j) => {
    const places = j.locations?.length ? j.locations : [{ city: j.city, region: j.state, country: j.country }];
    return {
      title: j.title,
      url: j.url ?? j.shortlink ?? `https://apply.workable.com/${account}/j/${j.shortcode}/`,
      applyUrl: j.application_url ?? null,
      location: places.map((p) => [p.city, p.region, p.country].filter(Boolean).join(", ")).filter(Boolean).join(" / ") || null,
      country: places[0]?.country ?? null,
      atsMode: j.workplace ?? (j.telecommuting ? "remote" : null),
      description: j.description ? j.description.replace(/<[^>]+>/g, " ") : null,
      postedAt: j.published_on ?? j.created_at ?? null,
      experienceText: j.experience ?? null,
    };
  });
}

export async function fetchWorkable(account: string): Promise<RawPosting[]> {
  const data = await politeJson<WorkableResponse>(
    `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(account)}?details=true`,
  );
  return mapWorkable(data, account);
}

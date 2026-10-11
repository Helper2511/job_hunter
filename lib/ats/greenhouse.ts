import { politeJson } from "@/lib/http";
import { htmlToText } from "@/lib/utils";
import type { RawPosting } from "./types";

interface GreenhouseResponse {
  jobs: {
    id: number;
    title: string;
    absolute_url: string;
    location?: { name?: string };
    updated_at?: string;
    first_published?: string;
    content?: string;
    offices?: { name?: string; location?: string }[];
  }[];
}

function decodeEntities(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

export function mapGreenhouse(data: GreenhouseResponse): RawPosting[] {
  return (data.jobs ?? []).map((j) => ({
    title: j.title,
    url: j.absolute_url,
    applyUrl: j.absolute_url,
    location: j.location?.name ?? j.offices?.map((o) => o.location ?? o.name).filter(Boolean).join(" / ") ?? null,
    description: j.content ? htmlToText(decodeEntities(j.content)) : null,
    postedAt: j.first_published ?? j.updated_at ?? null,
  }));
}

export async function fetchGreenhouse(token: string): Promise<RawPosting[]> {
  const data = await politeJson<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`,
  );
  return mapGreenhouse(data);
}

import { politeJson } from "@/lib/http";
import type { RawPosting } from "./types";

interface SmartRecruitersResponse {
  offset: number;
  limit: number;
  totalFound: number;
  content: {
    id: string;
    name: string;
    releasedDate?: string;
    location?: { city?: string; region?: string; country?: string; remote?: boolean; hybrid?: boolean; fullLocation?: string };
    experienceLevel?: { label?: string };
    company?: { identifier?: string };
  }[];
}

export function mapSmartRecruiters(data: SmartRecruitersResponse, companyId: string): RawPosting[] {
  return (data.content ?? []).map((p) => ({
    title: p.name,
    url: `https://jobs.smartrecruiters.com/${encodeURIComponent(p.company?.identifier ?? companyId)}/${p.id}`,
    location: p.location?.fullLocation ?? [p.location?.city, p.location?.region].filter(Boolean).join(", ") ?? null,
    country: p.location?.country?.toLowerCase() === "in" ? "India" : null,
    atsMode: p.location?.remote ? "remote" : p.location?.hybrid ? "hybrid" : null,
    postedAt: p.releasedDate ?? null,
    experienceText: p.experienceLevel?.label ?? null,
  }));
}

export async function fetchSmartRecruiters(companyId: string, maxPages = 5): Promise<RawPosting[]> {
  const out: RawPosting[] = [];
  const limit = 100;
  for (let page = 0; page < maxPages; page++) {
    const data = await politeJson<SmartRecruitersResponse>(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyId)}/postings?limit=${limit}&offset=${page * limit}`,
    );
    out.push(...mapSmartRecruiters(data, companyId));
    if ((page + 1) * limit >= (data.totalFound ?? 0)) break;
  }
  return out;
}

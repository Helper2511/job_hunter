import { politeJson } from "@/lib/http";
import { htmlToText } from "@/lib/utils";
import type { RawPosting } from "./types";

interface RecruiteeResponse {
  offers: {
    id: number;
    title: string;
    careers_url: string;
    careers_apply_url?: string;
    location?: string;
    city?: string;
    country?: string;
    remote?: boolean;
    hybrid?: boolean;
    on_site?: boolean;
    published_at?: string;
    created_at?: string;
    description?: string;
    requirements?: string;
    min_hours?: number;
    experience?: string;
    salary?: { min?: string; max?: string; currency?: string; period?: string };
  }[];
}

export function mapRecruitee(data: RecruiteeResponse): RawPosting[] {
  return (data.offers ?? []).map((o) => ({
    title: o.title,
    url: o.careers_url,
    applyUrl: o.careers_apply_url ?? o.careers_url,
    location: o.location ?? [o.city, o.country].filter(Boolean).join(", ") ?? null,
    country: o.country ?? null,
    atsMode: o.remote ? "remote" : o.hybrid ? "hybrid" : o.on_site ? "onsite" : null,
    description: htmlToText([o.description, o.requirements].filter(Boolean).join("\n")) || null,
    postedAt: o.published_at ?? o.created_at ?? null,
    experienceText: o.experience ?? null,
    salaryText: o.salary?.min ? `${o.salary.currency ?? ""} ${o.salary.min} - ${o.salary.max ?? ""} ${o.salary.period ?? ""}`.trim() : null,
  }));
}

export async function fetchRecruitee(company: string): Promise<RawPosting[]> {
  const data = await politeJson<RecruiteeResponse>(`https://${encodeURIComponent(company)}.recruitee.com/api/offers/`);
  return mapRecruitee(data);
}

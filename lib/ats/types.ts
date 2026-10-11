import type { NormalizedJob } from "@/lib/providers/types";
import { parseLocation } from "@/lib/matching/cities";
import { parseExperience, parseSalary } from "@/lib/matching/normalize";
import { detectRemoteScope, detectWorkMode } from "@/lib/matching/workMode";

export type AtsType = "greenhouse" | "lever" | "ashby" | "smartrecruiters" | "recruitee" | "workable";

/** A posting as read from a job board, before normalisation. */
export interface RawPosting {
  title: string;
  url: string;
  applyUrl?: string | null;
  location?: string | null;
  country?: string | null;
  atsMode?: string | null;
  jsonLdLocationType?: string | null;
  description?: string | null;
  postedAt?: string | number | Date | null;
  salaryText?: string | null;
  experienceText?: string | null;
}

function toDate(v: RawPosting["postedAt"]): Date | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function normalizePosting(
  p: RawPosting,
  company: { name: string; domain?: string | null },
  source: NormalizedJob["source"] = "career_page",
): NormalizedJob {
  const loc = parseLocation(p.location);
  const country = p.country ?? loc.country;
  const workMode = detectWorkMode({
    atsMode: p.atsMode,
    jsonLdLocationType: p.jsonLdLocationType,
    title: p.title,
    location: p.location,
    description: p.description,
  });
  const exp = parseExperience(p.experienceText ?? p.description?.slice(0, 4000));
  return {
    title: p.title.trim(),
    company: company.name,
    companyDomain: company.domain ?? null,
    location: p.location?.trim() || null,
    cities: loc.cities,
    country: country ?? null,
    workMode,
    remoteScope: workMode === "remote" ? detectRemoteScope(`${p.location ?? ""} ${p.title}`, country) : null,
    url: p.url,
    applyUrl: p.applyUrl ?? null,
    source,
    description: p.description?.slice(0, 20_000) ?? null,
    postedAt: toDate(p.postedAt),
    experienceMin: exp.min,
    experienceMax: exp.max,
    salaryText: p.salaryText ?? null,
    salaryMin: parseSalary(p.salaryText),
  };
}

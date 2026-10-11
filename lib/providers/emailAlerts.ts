import { parseLocation } from "@/lib/matching/cities";
import { parseExperience, parseSalary } from "@/lib/matching/normalize";
import { detectRemoteScope, detectWorkMode } from "@/lib/matching/workMode";
import type { ParsedAlertJob } from "@/lib/email/parsers";
import type { NormalizedJob } from "./types";

/** Turn jobs parsed out of a forwarded alert email into normalised jobs. */
export function normalizeAlertJobs(jobs: ParsedAlertJob[]): NormalizedJob[] {
  return jobs.map((j) => {
    const loc = parseLocation(j.location);
    const workMode = detectWorkMode({ title: j.title, location: j.location });
    const exp = parseExperience(j.experienceText);
    return {
      title: j.title,
      company: j.company,
      location: j.location,
      cities: loc.cities,
      country: loc.country,
      workMode,
      remoteScope: workMode === "remote" ? detectRemoteScope(j.location, loc.country) : null,
      url: j.url,
      applyUrl: j.url,
      source: j.source,
      experienceMin: exp.min,
      experienceMax: exp.max,
      salaryText: j.salaryText ?? null,
      salaryMin: parseSalary(j.salaryText),
    };
  });
}

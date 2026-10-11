import { locationsOverlap, titlesMatch } from "@/lib/matching/normalize";

export interface FlagJob {
  id: string;
  title: string;
  cities: string[];
  source: string;
  closedAt?: Date | null;
}

export type Visibility = "CAREER_PAGE_ONLY" | "BOTH" | "PLATFORM_ONLY" | "UNCHECKED";

function sameRole(a: FlagJob, b: FlagJob): boolean {
  return titlesMatch(a.title, b.title) && locationsOverlap(a.cities, b.cities);
}

/**
 * Compare a company's career-page jobs with its platform jobs.
 * `careerPageChecked` is false when the career page could not be read,
 * in which case platform jobs cannot be called "platform only".
 */
export function computeVisibility(jobs: FlagJob[], careerPageChecked: boolean): Map<string, Visibility> {
  const career = jobs.filter((j) => j.source === "career_page" && !j.closedAt);
  const platform = jobs.filter((j) => j.source !== "career_page" && j.source !== "manual" && !j.closedAt);
  const result = new Map<string, Visibility>();

  for (const c of career) {
    result.set(c.id, platform.some((p) => sameRole(c, p)) ? "BOTH" : "CAREER_PAGE_ONLY");
  }
  for (const p of platform) {
    if (!careerPageChecked) result.set(p.id, "UNCHECKED");
    else result.set(p.id, career.some((c) => sameRole(c, p)) ? "BOTH" : "PLATFORM_ONLY");
  }
  for (const j of jobs) {
    if (!result.has(j.id)) result.set(j.id, j.source === "career_page" ? "CAREER_PAGE_ONLY" : careerPageChecked ? "PLATFORM_ONLY" : "UNCHECKED");
  }
  return result;
}

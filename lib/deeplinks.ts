import type { WorkMode } from "@/lib/providers/types";
import { slugify } from "@/lib/utils";

/** Search links that open each platform's own search with keyword and location prefilled. */

const LINKEDIN_WORK_TYPE: Record<WorkMode, string> = { onsite: "1", remote: "2", hybrid: "3" };

export function linkedinSearchUrl(keywords: string, location?: string, opts: { workModes?: WorkMode[]; postedWithinDays?: number } = {}) {
  const p = new URLSearchParams();
  if (keywords) p.set("keywords", keywords);
  p.set("location", location || "India");
  if (opts.workModes?.length) p.set("f_WT", opts.workModes.map((m) => LINKEDIN_WORK_TYPE[m]).join(","));
  if (opts.postedWithinDays) p.set("f_TPR", `r${opts.postedWithinDays * 86400}`);
  return `https://www.linkedin.com/jobs/search/?${p.toString()}`;
}

export function naukriSearchUrl(keywords: string, location?: string) {
  const kw = slugify(keywords || "jobs");
  const path = location ? `${kw}-jobs-in-${slugify(location)}` : `${kw}-jobs`;
  const p = new URLSearchParams({ k: keywords });
  if (location) p.set("l", location);
  return `https://www.naukri.com/${path}?${p.toString()}`;
}

export function glassdoorSearchUrl(keywords: string, location?: string) {
  const p = new URLSearchParams({ "sc.keyword": keywords });
  if (location) p.set("locKeyword", location);
  return `https://www.glassdoor.co.in/Job/jobs.htm?${p.toString()}`;
}

export function platformSearchLinks(keywords: string, location?: string, workModes?: WorkMode[]) {
  return [
    { id: "linkedin", label: "LinkedIn", url: linkedinSearchUrl(keywords, location, { workModes }) },
    { id: "naukri", label: "Naukri", url: naukriSearchUrl(keywords, location) },
    { id: "glassdoor", label: "Glassdoor", url: glassdoorSearchUrl(keywords, location) },
  ];
}

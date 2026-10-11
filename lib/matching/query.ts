import { z } from "zod";
import type { CompanyType, JobQuery, JobSource, RemoteScope, WorkMode } from "@/lib/providers/types";

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
const COMPANY_TYPES = ["saas", "product", "services", "manufacturing", "other"] as const;
const SOURCES = ["linkedin", "naukri", "glassdoor", "career_page", "manual", "aggregator"] as const;

export const jobQuerySchema = z.object({
  keywords: z.string().max(200).default(""),
  workModes: z.array(z.enum(WORK_MODES)).optional(),
  locations: z.array(z.string().min(1).max(80)).max(10).optional(),
  radiusKm: z.number().int().min(1).max(200).optional(),
  remoteScope: z.enum(["india", "worldwide"]).optional(),
  experienceYears: z.tuple([z.number().min(0).max(50), z.number().min(0).max(50)]).optional(),
  postedWithinDays: z.number().int().min(1).max(365).optional(),
  companyTypes: z.array(z.enum(COMPANY_TYPES)).optional(),
  careerPageOnly: z.boolean().optional(),
  sources: z.array(z.enum(SOURCES)).optional(),
  salaryMin: z.number().int().min(0).optional(),
  hideUnknownWorkMode: z.boolean().optional(),
  hideUnclassified: z.boolean().optional(),
});

function list(value: string | null): string[] {
  return value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

function num(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

type ParamsLike = { get(name: string): string | null };

/** Read filters from URL search params (the jobs page keeps all filters in the URL). */
export function queryFromParams(params: ParamsLike): JobQuery {
  const exp = list(params.get("exp")).map(Number).filter((n) => Number.isFinite(n));
  const q: JobQuery = {
    keywords: params.get("q") ?? "",
    workModes: list(params.get("modes")).filter((m): m is WorkMode => (WORK_MODES as readonly string[]).includes(m)),
    locations: list(params.get("loc")),
    radiusKm: num(params.get("radius")),
    remoteScope: (["india", "worldwide"].includes(params.get("scope") ?? "") ? params.get("scope") : undefined) as
      | RemoteScope
      | undefined,
    experienceYears: exp.length === 2 ? [exp[0], exp[1]] : undefined,
    postedWithinDays: num(params.get("posted")),
    companyTypes: list(params.get("types")).filter((t): t is CompanyType =>
      (COMPANY_TYPES as readonly string[]).includes(t),
    ),
    careerPageOnly: params.get("cpo") === "1" || undefined,
    sources: list(params.get("src")).filter((s): s is JobSource => (SOURCES as readonly string[]).includes(s)),
    salaryMin: num(params.get("salary")),
    hideUnknownWorkMode: params.get("hideUnknown") === "1" || undefined,
    hideUnclassified: params.get("hideUnclassified") === "1" || undefined,
  };
  return jobQuerySchema.parse(q) as JobQuery;
}

export function queryToParams(q: Partial<JobQuery>): URLSearchParams {
  const p = new URLSearchParams();
  if (q.keywords) p.set("q", q.keywords);
  if (q.workModes?.length) p.set("modes", q.workModes.join(","));
  if (q.locations?.length) p.set("loc", q.locations.join(","));
  if (q.radiusKm) p.set("radius", String(q.radiusKm));
  if (q.remoteScope) p.set("scope", q.remoteScope);
  if (q.experienceYears) p.set("exp", q.experienceYears.join(","));
  if (q.postedWithinDays) p.set("posted", String(q.postedWithinDays));
  if (q.companyTypes?.length) p.set("types", q.companyTypes.join(","));
  if (q.careerPageOnly) p.set("cpo", "1");
  if (q.sources?.length) p.set("src", q.sources.join(","));
  if (q.salaryMin) p.set("salary", String(q.salaryMin));
  if (q.hideUnknownWorkMode) p.set("hideUnknown", "1");
  if (q.hideUnclassified) p.set("hideUnclassified", "1");
  return p;
}

/** How many filters beyond keywords are active (shown on the mobile "Filters" button). */
export function activeFilterCount(q: JobQuery): number {
  let n = 0;
  if (q.workModes?.length) n++;
  if (q.locations?.length) n++;
  if (q.radiusKm) n++;
  if (q.remoteScope) n++;
  if (q.experienceYears) n++;
  if (q.postedWithinDays) n++;
  if (q.companyTypes?.length) n++;
  if (q.careerPageOnly) n++;
  if (q.sources?.length) n++;
  if (q.salaryMin) n++;
  if (q.hideUnknownWorkMode) n++;
  if (q.hideUnclassified) n++;
  return n;
}

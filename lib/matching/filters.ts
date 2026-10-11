import type { JobQuery } from "@/lib/providers/types";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ANYWHERE_IN_INDIA, citiesWithin, expandLocation } from "./cities";

/** The concrete city names a query's locations cover, including regions and radius. */
export function resolveQueryCities(q: JobQuery): { cities: string[]; anywhereInIndia: boolean } {
  const locations = q.locations ?? [];
  const anywhereInIndia = locations.some((l) => l.toLowerCase() === ANYWHERE_IN_INDIA.toLowerCase());
  const named = locations.filter((l) => l.toLowerCase() !== ANYWHERE_IN_INDIA.toLowerCase());
  let cities = named.flatMap(expandLocation);
  if (q.radiusKm && named.length === 1) cities = [...cities, ...citiesWithin(named[0], q.radiusKm)];
  return { cities: Array.from(new Set(cities)), anywhereInIndia };
}

export interface FilterableJob {
  title: string;
  description?: string | null;
  companyName: string;
  companyType: string; // effective type for this user
  workMode: string;
  remoteScope?: string | null;
  cities: string[];
  country?: string | null;
  source: string;
  sources?: string[];
  visibility: string;
  postedAt?: Date | null;
  firstSeenAt: Date;
  experienceMin?: number | null;
  experienceMax?: number | null;
  salaryMin?: number | null;
}

function remoteScopeMatches(job: FilterableJob, wanted: JobQuery["remoteScope"]): boolean {
  if (!wanted) return true;
  if (wanted === "worldwide") return job.remoteScope === "worldwide";
  // Open to India: India-only roles, worldwide roles, and roles not tied to another country.
  return job.remoteScope === "india" || job.remoteScope === "worldwide" || !job.country || job.country === "India";
}

function placeMatches(job: FilterableJob, cities: string[], anywhereInIndia: boolean): boolean {
  if (cities.length === 0 && !anywhereInIndia) return true;
  if (anywhereInIndia && (job.country === "India" || job.cities.length === 0)) return true;
  const set = new Set(cities.map((c) => c.toLowerCase()));
  return job.cities.some((c) => set.has(c.toLowerCase()));
}

/**
 * The search rules from the spec, as a pure function:
 * - remote jobs ignore the city filter and match on remote scope instead;
 * - hybrid and on-site jobs must be in one of the chosen cities;
 * - jobs without a stated mode are included unless hidden;
 * - company type narrows the result further.
 */
export function jobMatchesQuery(job: FilterableJob, q: JobQuery, now = new Date()): boolean {
  const { cities, anywhereInIndia } = resolveQueryCities(q);
  const modes = q.workModes ?? [];

  if (job.workMode === "remote") {
    if (modes.length && !modes.includes("remote")) return false;
    if (!remoteScopeMatches(job, q.remoteScope)) return false;
  } else if (job.workMode === "hybrid" || job.workMode === "onsite") {
    if (modes.length && !modes.includes(job.workMode)) return false;
    if (!placeMatches(job, cities, anywhereInIndia)) return false;
  } else {
    if (q.hideUnknownWorkMode) return false;
    if (job.cities.length > 0 && !placeMatches(job, cities, anywhereInIndia)) return false;
  }

  if (q.companyTypes?.length) {
    if (job.companyType === "unknown") {
      if (q.hideUnclassified) return false;
    } else if (!q.companyTypes.includes(job.companyType as never)) {
      return false;
    }
  } else if (q.hideUnclassified && job.companyType === "unknown") {
    return false;
  }

  if (q.keywords.trim()) {
    const hay = `${job.title} ${job.companyName} ${job.description ?? ""}`.toLowerCase();
    const terms = q.keywords.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every((t) => hay.includes(t))) return false;
  }

  if (q.postedWithinDays) {
    const when = job.postedAt ?? job.firstSeenAt;
    if (now.getTime() - when.getTime() > q.postedWithinDays * 86_400_000) return false;
  }

  if (q.careerPageOnly && job.visibility !== "CAREER_PAGE_ONLY") return false;

  if (q.sources?.length) {
    const seen = job.sources ?? [job.source];
    if (!seen.some((s) => q.sources!.includes(s as never))) return false;
  }

  if (q.experienceYears) {
    const [min, max] = q.experienceYears;
    if (job.experienceMin != null && job.experienceMin > max) return false;
    if (job.experienceMax != null && job.experienceMax < min) return false;
  }

  if (q.salaryMin && job.salaryMin != null && job.salaryMin < q.salaryMin) return false;

  return true;
}

/**
 * The same rules as a Prisma filter, so the database does the work.
 * `corrections` maps companyId -> the type this user set for it.
 */
export function buildJobWhere(
  q: JobQuery,
  opts: { userId?: string; corrections?: Record<string, string>; now?: Date } = {},
): Prisma.JobWhereInput {
  const now = opts.now ?? new Date();
  const { cities, anywhereInIndia } = resolveQueryCities(q);
  const modes = q.workModes ?? [];
  const and: Prisma.JobWhereInput[] = [{ closedAt: null }];

  const place: Prisma.JobWhereInput | null =
    cities.length || anywhereInIndia
      ? {
          OR: [
            ...(cities.length ? [{ cities: { hasSome: cities } }] : []),
            ...(anywhereInIndia ? [{ country: "India" }, { cities: { isEmpty: true } }] : []),
          ],
        }
      : null;

  const modeBranches: Prisma.JobWhereInput[] = [];
  if (!modes.length || modes.includes("remote")) {
    const remote: Prisma.JobWhereInput = { workMode: "remote" };
    if (q.remoteScope === "worldwide") remote.remoteScope = "worldwide";
    if (q.remoteScope === "india") {
      remote.OR = [{ remoteScope: { in: ["india", "worldwide"] } }, { country: null }, { country: "India" }];
    }
    modeBranches.push(remote);
  }
  const placed = (["hybrid", "onsite"] as const).filter((m) => !modes.length || modes.includes(m));
  if (placed.length) {
    modeBranches.push({ workMode: { in: [...placed] }, ...(place ?? {}) });
  }
  if (!q.hideUnknownWorkMode) {
    modeBranches.push(
      place
        ? { workMode: "unknown", OR: [{ cities: { isEmpty: true } }, ...(place.OR ?? [])] }
        : { workMode: "unknown" },
    );
  }
  and.push({ OR: modeBranches });

  const corrections = opts.corrections ?? {};
  const correctedIds = Object.keys(corrections);
  if (q.companyTypes?.length || q.hideUnclassified) {
    const types: string[] = q.companyTypes?.length
      ? [...q.companyTypes, ...(q.hideUnclassified ? [] : ["unknown"])]
      : ["saas", "product", "services", "manufacturing", "other"];
    const matchingCorrected = correctedIds.filter((id) => types.includes(corrections[id]));
    and.push({
      OR: [
        { company: { companyType: { in: types } }, companyId: { notIn: correctedIds } },
        ...(matchingCorrected.length ? [{ companyId: { in: matchingCorrected } }] : []),
      ],
    });
  }

  const terms = q.keywords.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  for (const term of terms) {
    and.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { company: { name: { contains: term, mode: "insensitive" } } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  if (q.postedWithinDays) {
    const since = new Date(now.getTime() - q.postedWithinDays * 86_400_000);
    and.push({ OR: [{ postedAt: { gte: since } }, { postedAt: null, firstSeenAt: { gte: since } }] });
  }
  if (q.careerPageOnly) and.push({ visibility: "CAREER_PAGE_ONLY" });
  if (q.sources?.length) and.push({ source: { in: q.sources } });
  if (q.experienceYears) {
    const [min, max] = q.experienceYears;
    and.push({ OR: [{ experienceMin: null }, { experienceMin: { lte: max } }] });
    and.push({ OR: [{ experienceMax: null }, { experienceMax: { gte: min } }] });
  }
  if (q.salaryMin) and.push({ OR: [{ salaryMin: null }, { salaryMin: { gte: q.salaryMin } }] });
  if (opts.userId) and.push({ hiddenBy: { none: { userId: opts.userId } } });

  return { AND: and };
}

import "server-only";
import { db } from "@/lib/db";
import { dedupeKey } from "@/lib/matching/dedupe";
import { normalizeCompanyName } from "@/lib/matching/normalize";
import type { NormalizedJob } from "@/lib/providers/types";
import { computeVisibility } from "@/lib/companies/flag";

/** Find a company by domain, then by normalised name; create it if missing. */
export async function findOrCreateCompany(name: string, domain?: string | null) {
  if (domain) {
    const byDomain = await db.company.findUnique({ where: { domain } });
    if (byDomain) return byDomain;
  }
  const norm = normalizeCompanyName(name);
  const candidates = await db.company.findMany({
    where: { name: { contains: name.split(/\s+/)[0], mode: "insensitive" } },
    take: 20,
  });
  const match = candidates.find((c) => normalizeCompanyName(c.name) === norm);
  if (match) {
    if (domain && !match.domain) return db.company.update({ where: { id: match.id }, data: { domain } });
    return match;
  }
  return db.company.create({ data: { name: name.trim(), domain: domain ?? null } });
}

/** Store jobs from any source. Returns ids of rows that were new. */
export async function upsertJobs(jobs: NormalizedJob[], companyId?: string): Promise<{ ids: string[]; created: string[] }> {
  const ids: string[] = [];
  const created: string[] = [];
  const touchedCompanies = new Set<string>();
  for (const job of jobs) {
    const company = companyId
      ? await db.company.findUniqueOrThrow({ where: { id: companyId } })
      : await findOrCreateCompany(job.company, job.companyDomain);
    const key = dedupeKey(company.name, job.title, job.cities, job.workMode);
    const data = {
      title: job.title,
      location: job.location ?? null,
      cities: job.cities,
      country: job.country ?? null,
      workMode: job.workMode,
      remoteScope: job.remoteScope ?? null,
      url: job.url,
      applyUrl: job.applyUrl ?? null,
      description: job.description ?? null,
      experienceMin: job.experienceMin ?? null,
      experienceMax: job.experienceMax ?? null,
      salaryText: job.salaryText ?? null,
      salaryMin: job.salaryMin ?? null,
      postedAt: job.postedAt ?? null,
    };
    const existing = await db.job.findUnique({ where: { dedupeKey_source: { dedupeKey: key, source: job.source } } });
    if (existing) {
      await db.job.update({ where: { id: existing.id }, data: { ...data, lastSeenAt: new Date(), closedAt: null } });
      ids.push(existing.id);
    } else {
      const row = await db.job.create({ data: { ...data, companyId: company.id, source: job.source, dedupeKey: key } });
      ids.push(row.id);
      created.push(row.id);
    }
    touchedCompanies.add(company.id);
  }
  for (const id of touchedCompanies) await refreshVisibility(id);
  return { ids, created };
}

/** Step 4 of the checker: recompute visibility flags for one company. */
export async function refreshVisibility(companyId: string) {
  const company = await db.company.findUnique({ where: { id: companyId } });
  if (!company) return;
  const jobs = await db.job.findMany({
    where: { companyId },
    select: { id: true, title: true, cities: true, source: true, closedAt: true, visibility: true },
  });
  const checked = company.checkStatus === "ok";
  const flags = computeVisibility(jobs, checked);
  for (const job of jobs) {
    const next = flags.get(job.id);
    if (next && next !== job.visibility) {
      await db.job.update({ where: { id: job.id }, data: { visibility: next } });
    }
  }
}

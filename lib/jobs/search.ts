import "server-only";
import { db } from "@/lib/db";
import { groupByDedupeKey } from "@/lib/matching/dedupe";
import { buildJobWhere } from "@/lib/matching/filters";
import type { JobQuery } from "@/lib/providers/types";

export interface JobCardData {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyType: string;
  location: string | null;
  cities: string[];
  workMode: string;
  remoteScope: string | null;
  postedAt: string;
  visibility: string;
  sources: string[];
  status: string | null;
}

export async function userCorrections(userId: string): Promise<Record<string, string>> {
  const rows = await db.companyTypeCorrection.findMany({ where: { userId }, select: { companyId: true, type: true } });
  return Object.fromEntries(rows.map((r) => [r.companyId, r.type]));
}

export async function searchJobs(userId: string, q: JobQuery, limit = 200): Promise<{ jobs: JobCardData[]; truncated: boolean }> {
  const corrections = await userCorrections(userId);
  const rows = await db.job.findMany({
    where: buildJobWhere(q, { userId, corrections }),
    include: {
      company: { select: { name: true, companyType: true } },
      applications: { where: { userId }, select: { status: true } },
    },
    orderBy: [{ firstSeenAt: "desc" }],
    take: limit + 1,
  });
  const truncated = rows.length > limit;
  const grouped = groupByDedupeKey(rows.slice(0, limit));

  // Status for any row in the group (an application may be on another source's row);
  // an actual application wins over a plain save.
  const statusByKey = new Map<string, string>();
  for (const r of rows) {
    const s = r.applications[0]?.status;
    const current = statusByKey.get(r.dedupeKey);
    if (s && (!current || current === "SAVED")) statusByKey.set(r.dedupeKey, s);
  }

  const jobs = grouped
    .map((r) => ({
      id: r.id,
      title: r.title,
      companyId: r.companyId,
      companyName: r.company.name,
      companyType: corrections[r.companyId] ?? r.company.companyType,
      location: r.location,
      cities: r.cities,
      workMode: r.workMode,
      remoteScope: r.remoteScope,
      postedAt: (r.postedAt ?? r.firstSeenAt).toISOString(),
      visibility: r.visibility,
      sources: r.sources,
      status: statusByKey.get(r.dedupeKey) ?? null,
    }))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  return { jobs, truncated };
}

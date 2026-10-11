import "server-only";
import { db } from "@/lib/db";
import { buildJobWhere } from "@/lib/matching/filters";
import type { JobProvider, JobQuery, NormalizedJob } from "./types";

/** Jobs already read from company career pages (the checker fills the pool). */
export const careerPageProvider: JobProvider = {
  id: "career-page",
  async search(q: JobQuery): Promise<NormalizedJob[]> {
    const rows = await db.job.findMany({
      where: { AND: [buildJobWhere(q), { source: "career_page" }] },
      include: { company: true },
      take: 200,
      orderBy: { firstSeenAt: "desc" },
    });
    return rows.map((r) => ({
      title: r.title,
      company: r.company.name,
      companyDomain: r.company.domain,
      location: r.location,
      cities: r.cities,
      country: r.country,
      workMode: r.workMode as NormalizedJob["workMode"],
      remoteScope: r.remoteScope as NormalizedJob["remoteScope"],
      url: r.url,
      applyUrl: r.applyUrl,
      source: "career_page",
      description: r.description,
      postedAt: r.postedAt,
    }));
  },
};

import "server-only";
import { db } from "@/lib/db";
import { buildJobWhere } from "@/lib/matching/filters";
import { jobQuerySchema } from "@/lib/matching/query";
import { queryToParams } from "@/lib/matching/query";
import type { JobQuery } from "@/lib/providers/types";
import { notifyUser } from "@/lib/notify";

/** For every saved search with notifications on, tell the user about jobs first seen since the last run. */
export async function runSavedSearchAlerts(): Promise<number> {
  const searches = await db.savedSearch.findMany({ where: { notify: true } });
  let sent = 0;
  for (const s of searches) {
    const parsed = jobQuerySchema.safeParse(s.query);
    if (!parsed.success) continue;
    const q = parsed.data as JobQuery;
    const since = s.lastNotified ?? s.createdAt;
    const corrections = Object.fromEntries(
      (await db.companyTypeCorrection.findMany({ where: { userId: s.userId } })).map((c) => [c.companyId, c.type]),
    );
    const count = await db.job.count({
      where: { AND: [buildJobWhere(q, { userId: s.userId, corrections }), { firstSeenAt: { gt: since } }] },
    });
    if (count > 0) {
      await notifyUser(s.userId, {
        title: `${count} new job${count === 1 ? "" : "s"} for "${s.name}"`,
        body: "New roles match one of your saved searches.",
        url: `/jobs?${queryToParams(q).toString()}`,
      });
      sent++;
    }
    await db.savedSearch.update({ where: { id: s.id }, data: { lastNotified: new Date() } });
  }
  return sent;
}

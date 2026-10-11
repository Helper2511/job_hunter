import { db } from "@/lib/db";
import { checkCompany, classifyCompany } from "@/lib/companies/check";
import { notifyUser } from "@/lib/notify";
import { runSavedSearchAlerts } from "@/lib/savedSearchAlerts";
import { EVENTS, inngest } from "./client";

/** Re-check every watched company once a day, then send saved-search alerts. */
export const dailyCareerPageCheck = inngest.createFunction(
  { id: "daily-career-page-check", triggers: [{ cron: "TZ=Asia/Kolkata 0 6 * * *" }] },
  async ({ step }) => {
    const companyIds = await step.run("list-watched-companies", async () => {
      const rows = await db.company.findMany({ where: { watchers: { some: {} } }, select: { id: true } });
      return rows.map((r) => r.id);
    });
    if (companyIds.length) {
      await step.sendEvent(
        "fan-out-checks",
        companyIds.map((id) => ({ name: EVENTS.companyCheck, data: { companyId: id, notify: true } })),
      );
    }
    await step.sleep("let-checks-finish", "30m");
    const alerts = await step.run("saved-search-alerts", () => runSavedSearchAlerts());
    return { companies: companyIds.length, alerts };
  },
);

/** One company: read its career page, flag roles, tell watchers about new career-page-only roles. */
export const checkOneCompany = inngest.createFunction(
  {
    id: "check-company",
    triggers: [{ event: EVENTS.companyCheck }],
    concurrency: { limit: 5 },
    throttle: { limit: 1, period: "1s", key: "event.data.companyId" },
  },
  async ({ event, step }) => {
    const companyId = event.data.companyId as string;
    const before = new Date();
    const outcome = await step.run("check", () => checkCompany(companyId));
    if (event.data.notify && outcome.created > 0) {
      await step.run("notify-watchers", async () => {
        const fresh = await db.job.count({
          where: { companyId, visibility: "CAREER_PAGE_ONLY", firstSeenAt: { gte: before } },
        });
        if (!fresh) return 0;
        const company = await db.company.findUniqueOrThrow({ where: { id: companyId }, include: { watchers: true } });
        for (const w of company.watchers) {
          await notifyUser(w.userId, {
            title: `${company.name} posted ${fresh} career-page-only role${fresh === 1 ? "" : "s"}`,
            body: "These roles are on the company site but not on the job platforms.",
            url: `/companies/${company.id}`,
          });
        }
        return company.watchers.length;
      });
    }
    return outcome;
  },
);

/** Classify new companies, and re-classify every 90 days. */
export const classifyCompanies = inngest.createFunction(
  { id: "classify-companies", triggers: [{ event: EVENTS.companyClassify }, { cron: "TZ=Asia/Kolkata 30 3 * * 0" }] },
  async ({ event, step }) => {
    const ids = await step.run("pick-companies", async () => {
      const requested = (event.data as { companyId?: string }).companyId;
      if (requested) return [requested];
      const cutoff = new Date(Date.now() - 90 * 86_400_000);
      const rows = await db.company.findMany({
        where: {
          domain: { not: null },
          companyTypeSource: { not: "reviewed" },
          OR: [{ typeCheckedAt: null }, { typeCheckedAt: { lt: cutoff } }],
        },
        select: { id: true },
        take: 200,
      });
      return rows.map((r) => r.id);
    });
    for (const id of ids) {
      await step.run(`classify-${id}`, () => classifyCompany(id));
    }
    return { classified: ids.length };
  },
);

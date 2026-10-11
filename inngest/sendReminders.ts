import { db } from "@/lib/db";
import { notifyUser } from "@/lib/notify";
import { formatDateTime } from "@/lib/utils";
import { inngest } from "./client";

/** Interview reminders (one day and one hour before) and follow-up reminders. */
export const sendReminders = inngest.createFunction(
  { id: "send-reminders", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const now = Date.now();

    const day = await step.run("interview-day-before", async () => {
      const due = await db.interviewPrep.findMany({
        where: { reminderDaySent: false, interviewAt: { gt: new Date(now), lte: new Date(now + 24 * 3_600_000) } },
        include: { application: { include: { job: { include: { company: true } } } } },
      });
      for (const p of due) {
        await notifyUser(p.application.userId, {
          title: `Interview tomorrow: ${p.application.job.title} at ${p.application.job.company.name}`,
          body: `Scheduled for ${formatDateTime(p.interviewAt!)}. Your prep page is ready.`,
          url: `/applications/${p.applicationId}/prep`,
        });
        await db.interviewPrep.update({ where: { id: p.id }, data: { reminderDaySent: true } });
      }
      return due.length;
    });

    const hour = await step.run("interview-hour-before", async () => {
      const due = await db.interviewPrep.findMany({
        where: { reminderHourSent: false, interviewAt: { gt: new Date(now), lte: new Date(now + 3_600_000) } },
        include: { application: { include: { job: { include: { company: true } } } } },
      });
      for (const p of due) {
        await notifyUser(p.application.userId, {
          title: `Interview in one hour: ${p.application.job.company.name}`,
          body: "Check the checklist and your notes.",
          url: `/applications/${p.applicationId}/prep`,
        });
        await db.interviewPrep.update({ where: { id: p.id }, data: { reminderHourSent: true, reminderDaySent: true } });
      }
      return due.length;
    });

    const followUps = await step.run("follow-ups", async () => {
      const due = await db.application.findMany({
        where: { status: "APPLIED", followUpAt: { lte: new Date(now) }, followUpNotifiedAt: null },
        include: { job: { include: { company: true } } },
        take: 200,
      });
      for (const a of due) {
        await notifyUser(a.userId, {
          title: `Follow up with ${a.job.company.name}`,
          body: `You applied for ${a.job.title}. A short follow-up note can help.`,
          url: "/applications",
        });
        await db.application.update({ where: { id: a.id }, data: { followUpNotifiedAt: new Date() } });
      }
      return due.length;
    });

    return { day, hour, followUps };
  },
);

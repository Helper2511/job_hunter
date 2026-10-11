import { db } from "@/lib/db";
import { processInboundEmail } from "@/lib/inbound";
import { EVENTS, inngest } from "./client";

export const parseAlertEmail = inngest.createFunction(
  { id: "parse-alert-email", triggers: [{ event: EVENTS.alertReceived }], retries: 2 },
  async ({ event, step }) => {
    return step.run("parse", () => processInboundEmail(event.data.inboundEmailId as string));
  },
);

/** Raw forwarded emails are deleted after 7 days. */
export const purgeInboundEmails = inngest.createFunction(
  { id: "purge-inbound-emails", triggers: [{ cron: "TZ=Asia/Kolkata 15 2 * * *" }] },
  async ({ step }) => {
    return step.run("delete-old", async () => {
      const cutoff = new Date(Date.now() - 7 * 86_400_000);
      const { count } = await db.inboundEmail.deleteMany({ where: { receivedAt: { lt: cutoff } } });
      return { deleted: count };
    });
  },
);

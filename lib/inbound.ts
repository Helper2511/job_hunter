import "server-only";
import { db } from "@/lib/db";
import { parseAlert } from "@/lib/email/parsers";
import { upsertJobs } from "@/lib/jobs/upsert";
import { normalizeAlertJobs } from "@/lib/providers/emailAlerts";

/** Parse one stored alert email into Job rows. */
export async function processInboundEmail(id: string): Promise<{ jobs: number }> {
  const email = await db.inboundEmail.findUnique({ where: { id } });
  if (!email || email.processedAt) return { jobs: email?.jobsFound ?? 0 };
  if (email.kind !== "alert" || !email.source) {
    await db.inboundEmail.update({ where: { id }, data: { processedAt: new Date() } });
    return { jobs: 0 };
  }
  const parsed = parseAlert(email.source as "linkedin" | "naukri" | "glassdoor", email.htmlBody, email.textBody);
  const { ids } = await upsertJobs(normalizeAlertJobs(parsed));
  await db.inboundEmail.update({ where: { id }, data: { processedAt: new Date(), jobsFound: ids.length } });
  return { jobs: ids.length };
}

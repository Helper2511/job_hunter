import { json, withUser } from "@/lib/api";
import { db } from "@/lib/db";
import { extractForwardingConfirmation } from "@/lib/email/parsers";

/** Onboarding polls this to show the forwarding confirmation and the first alert. */
export async function GET() {
  return withUser(async (userId) => {
    const [confirmation, firstAlert] = await Promise.all([
      db.inboundEmail.findFirst({ where: { userId, kind: "forwarding_confirmation" }, orderBy: { receivedAt: "desc" } }),
      db.inboundEmail.findFirst({ where: { userId, kind: "alert" }, orderBy: { receivedAt: "desc" } }),
    ]);
    return json({
      confirmation: confirmation
        ? {
            subject: confirmation.subject,
            receivedAt: confirmation.receivedAt,
            ...extractForwardingConfirmation(confirmation.textBody, confirmation.htmlBody),
          }
        : null,
      firstAlert: firstAlert ? { source: firstAlert.source, receivedAt: firstAlert.receivedAt, jobsFound: firstAlert.jobsFound } : null,
    });
  });
}

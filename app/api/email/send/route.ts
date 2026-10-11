import { z } from "zod";
import { auth } from "@/lib/auth";
import { errorJson, json, withUser } from "@/lib/api";
import { MAX_DAILY_EMAILS } from "@/lib/constants";
import { db } from "@/lib/db";
import { fetchGoogleEmail, GmailError, sendGmail } from "@/lib/email/gmail";
import { consumeUsage, releaseUsage } from "@/lib/limits";
import { getGoogleAccount, hasGmailSend } from "@/lib/session";
import { downloadResume } from "@/lib/storage";

const body = z.object({
  jobId: z.string(),
  resumeId: z.string(),
  to: z.string().email("Enter a valid email address"),
  subject: z.string().trim().min(1, "Add a subject").max(200),
  body: z.string().trim().min(20, "Write a short message").max(10_000),
});

/** Send the reviewed draft from the user's own Gmail. Every send is an explicit click. */
export async function POST(request: Request) {
  return withUser(async (userId) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorJson(parsed.error.issues[0]?.message ?? "Check the email fields");
    const input = parsed.data;

    const [user, job, resume, account] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: userId } }),
      db.job.findUnique({ where: { id: input.jobId }, include: { company: true } }),
      db.resume.findFirst({ where: { id: input.resumeId, userId } }),
      getGoogleAccount(userId),
    ]);
    if (!job) return errorJson("This job no longer exists.", 404);
    if (!resume) return errorJson("Pick a resume to attach.");
    if (!account || !hasGmailSend(account.scope)) return errorJson("Connect Gmail first.", 403);

    // One email per company per role.
    const duplicate = await db.application.findFirst({
      where: { userId, method: "email", job: { companyId: job.companyId, dedupeKey: job.dedupeKey } },
    });
    if (duplicate) return errorJson("You already emailed this company about this role.", 409);

    const limit = Math.min(user.dailyEmailLimit, MAX_DAILY_EMAILS);
    if (!(await consumeUsage(userId, "email", limit))) {
      return errorJson("You reached today’s limit of emails. It resets tomorrow.", 429);
    }

    try {
      const { accessToken } = await auth.api.getAccessToken({ body: { accountId: account.id, userId } });
      let from = user.gmailAddress;
      if (!from) {
        from = await fetchGoogleEmail(accessToken);
        if (from) await db.user.update({ where: { id: userId }, data: { gmailAddress: from } });
      }
      const data = await downloadResume(resume.filePath);
      await sendGmail(accessToken, {
        from: from ?? user.email,
        fromName: user.name,
        to: input.to,
        subject: input.subject,
        text: input.body,
        attachment: { filename: resume.fileName, contentType: "application/pdf", data },
      });
    } catch (err) {
      await releaseUsage(userId, "email");
      if (err instanceof GmailError) return errorJson(err.message, err.needsReconnect ? 403 : 502);
      console.error(err);
      return errorJson("Gmail could not send this email. Try again in a minute.", 502);
    }

    const app = await db.application.upsert({
      where: { userId_jobId: { userId, jobId: job.id } },
      create: {
        userId,
        jobId: job.id,
        method: "email",
        status: "APPLIED",
        resumeId: resume.id,
        emailTo: input.to,
        emailSubject: input.subject,
        followUpAt: new Date(Date.now() + 7 * 86_400_000),
      },
      update: {
        method: "email",
        status: "APPLIED",
        resumeId: resume.id,
        emailTo: input.to,
        emailSubject: input.subject,
        appliedAt: new Date(),
        followUpAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
    return json({ id: app.id });
  });
}

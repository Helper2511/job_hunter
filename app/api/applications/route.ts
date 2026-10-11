import { z } from "zod";
import { errorJson, json, withUser } from "@/lib/api";
import { db } from "@/lib/db";

const body = z.object({
  jobId: z.string().min(1),
  method: z.enum(["email", "apply_link", "manual"]),
  resumeId: z.string().optional(),
});

/** Record that the user applied (after clicking apply or sending an email). */
export async function POST(request: Request) {
  return withUser(async (userId) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorJson("Missing job");
    const { jobId, method, resumeId } = parsed.data;
    const job = await db.job.findUnique({ where: { id: jobId }, select: { id: true } });
    if (!job) return errorJson("This job no longer exists.", 404);
    const resume = resumeId ? await db.resume.findFirst({ where: { id: resumeId, userId }, select: { id: true } }) : null;
    const followUpAt = new Date(Date.now() + 7 * 86_400_000);
    const app = await db.application.upsert({
      where: { userId_jobId: { userId, jobId } },
      create: { userId, jobId, method, status: "APPLIED", resumeId: resume?.id ?? null, followUpAt },
      update: { method, status: "APPLIED", resumeId: resume?.id ?? undefined, appliedAt: new Date(), followUpAt },
    });
    return json({ id: app.id });
  });
}

export async function GET() {
  return withUser(async (userId) => {
    const rows = await db.application.findMany({
      where: { userId },
      include: { job: { include: { company: { select: { name: true } } } } },
      orderBy: { updatedAt: "desc" },
    });
    return json({ applications: rows });
  });
}

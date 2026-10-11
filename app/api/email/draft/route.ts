import { z } from "zod";
import { errorJson, json, withUser } from "@/lib/api";
import { db } from "@/lib/db";
import { defaultCoverNote, defaultSubject } from "@/lib/email/templates";
import { features } from "@/lib/env";
import { llmText } from "@/lib/llm";
import { computeSkillsGap } from "@/lib/prep/skillsGap";

const body = z.object({ jobId: z.string(), resumeId: z.string().optional() });

/** Subject and a short cover note from the job description and resume. Always editable. */
export async function POST(request: Request) {
  return withUser(async (userId) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorJson("Missing job");
    const [user, job, resume] = await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: userId } }),
      db.job.findUnique({ where: { id: parsed.data.jobId }, include: { company: true } }),
      parsed.data.resumeId ? db.resume.findFirst({ where: { id: parsed.data.resumeId, userId } }) : null,
    ]);
    if (!job) return errorJson("This job no longer exists.", 404);

    const subject = defaultSubject(job.title, user.name);
    const gap = computeSkillsGap(job.description ?? job.title, resume?.textContent ?? null);
    const matched = gap.required.filter((s) => !gap.missing.includes(s)).slice(0, 3);
    let text = defaultCoverNote({
      name: user.name,
      jobTitle: job.title,
      company: job.company.name,
      phone: user.phone,
      linkedinUrl: user.linkedinUrl,
      highlights: resume?.textContent ? matched.map((s) => `Hands-on experience with ${s}`) : [],
    });

    if (features.llm && (job.description || resume?.textContent)) {
      try {
        text = await llmText({
          userId,
          system:
            "Write a short, plain cover email (under 150 words) from a job seeker to a company's hiring team. No flattery, no made-up facts: use only what the resume shows. End with the candidate's name. Plain text only.",
          prompt: [
            `Role: ${job.title} at ${job.company.name}`,
            `Candidate: ${user.name}${user.phone ? `, ${user.phone}` : ""}${user.linkedinUrl ? `, ${user.linkedinUrl}` : ""}`,
            job.description ? `Job description:\n${job.description.slice(0, 4000)}` : null,
            resume?.textContent ? `Resume:\n${resume.textContent.slice(0, 4000)}` : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
        });
      } catch {
        // keep the template
      }
    }
    return json({ to: job.company.hrEmail, subject, body: text });
  });
}

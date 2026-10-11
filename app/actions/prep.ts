"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const prepSchema = z.object({
  roleSummary: z.string().max(10_000).nullable(),
  skillsGap: z.array(z.string().max(100)).max(50),
  studyList: z.array(z.string().max(300)).max(50),
  questions: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["technical", "role", "behavioural", "own"]),
        question: z.string().max(500),
        answer: z.string().max(10_000),
        draft: z.boolean(),
      }),
    )
    .max(100),
  companyNotes: z.string().max(20_000).nullable(),
  checklist: z.array(z.object({ id: z.string(), label: z.string().max(200), done: z.boolean() })).max(50),
  interviewAt: z.string().nullable(),
  roundType: z.string().max(80).nullable(),
  interviewers: z.string().max(300).nullable(),
  roundNotes: z.string().max(20_000).nullable(),
});

export type PrepInput = z.infer<typeof prepSchema>;

export async function savePrep(applicationId: string, input: PrepInput) {
  const user = await requireUser();
  const data = prepSchema.parse(input);
  const prep = await db.interviewPrep.findFirst({ where: { applicationId, application: { userId: user.id } } });
  if (!prep) return { error: "Prep page not found." };
  const interviewAt = data.interviewAt ? new Date(data.interviewAt) : null;
  const moved = (interviewAt?.getTime() ?? null) !== (prep.interviewAt?.getTime() ?? null);
  await db.interviewPrep.update({
    where: { id: prep.id },
    data: {
      ...data,
      questions: data.questions,
      checklist: data.checklist,
      interviewAt,
      // A new date means new reminders.
      ...(moved ? { reminderDaySent: false, reminderHourSent: false } : {}),
    },
  });
  revalidatePath(`/applications/${applicationId}/prep`);
  return { ok: true };
}

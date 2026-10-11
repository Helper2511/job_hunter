import "server-only";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { llmObject, llmText } from "@/lib/llm";
import { defaultCompanyNotes } from "./companyNotes";
import { DEFAULT_CHECKLIST, QUESTIONS_SYSTEM, llmQuestionsSchema, questionId, templateQuestions, type PrepQuestion } from "./questions";
import { computeSkillsGap, extractSkills, summarizeRole } from "./skillsGap";

async function loadContext(applicationId: string) {
  const app = await db.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { job: { include: { company: true } }, resume: true },
  });
  const resume = app.resume ?? (await db.resume.findFirst({ where: { userId: app.userId, isDefault: true } }));
  return { app, job: app.job, company: app.job.company, resumeText: resume?.textContent ?? null };
}

export async function generateQuestions(
  applicationId: string,
  userId: string,
  focus?: string,
): Promise<{ questions: PrepQuestion[]; generatedBy: "llm" | "rules" }> {
  const { job, company, resumeText } = await loadContext(applicationId);
  const description = job.description ?? job.title;
  if (features.llm) {
    try {
      const result = await llmObject({
        schema: llmQuestionsSchema,
        system: QUESTIONS_SYSTEM,
        userId,
        prompt: [
          `Role: ${job.title} at ${company.name}`,
          focus ? `Focus on: ${focus}` : null,
          `Job description:\n${description.slice(0, 6000)}`,
          resumeText ? `Candidate resume:\n${resumeText.slice(0, 4000)}` : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
      });
      return {
        questions: result.questions.map((q) => ({ id: questionId(), type: q.type, question: q.question, answer: "", draft: true })),
        generatedBy: "llm",
      };
    } catch {
      // fall back to templates
    }
  }
  return { questions: templateQuestions(job.title, company.name, extractSkills(description)), generatedBy: "rules" };
}

/** Create the prep page for an application (idempotent). */
export async function ensurePrep(applicationId: string, userId: string) {
  const existing = await db.interviewPrep.findUnique({ where: { applicationId } });
  if (existing) return existing;

  const { job, company, resumeText } = await loadContext(applicationId);
  const description = job.description ?? "";
  const gap = computeSkillsGap(description || job.title, resumeText);
  let roleSummary = description ? summarizeRole(description) : null;
  if (features.llm && description) {
    try {
      roleSummary = await llmText({
        userId,
        system: "Summarise a job description for a candidate: up to 6 bullet points covering key responsibilities and must-have skills. Plain text bullets starting with •.",
        prompt: description.slice(0, 6000),
      });
    } catch {
      // keep the rule-based summary
    }
  }
  const { questions, generatedBy } = await generateQuestions(applicationId, userId);

  return db.interviewPrep.create({
    data: {
      applicationId,
      roleSummary,
      skillsGap: gap.missing,
      studyList: gap.studyList,
      questions: questions as unknown as object,
      companyNotes: defaultCompanyNotes(company),
      checklist: DEFAULT_CHECKLIST.map((label, i) => ({ id: `c${i}`, label, done: false })),
      generatedBy,
    },
  });
}

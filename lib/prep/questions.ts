import { z } from "zod";

export type QuestionType = "technical" | "role" | "behavioural" | "own";

export interface PrepQuestion {
  id: string;
  type: QuestionType;
  question: string;
  answer: string;
  draft: boolean;
}

export const llmQuestionsSchema = z.object({
  questions: z
    .array(z.object({ type: z.enum(["technical", "role", "behavioural"]), question: z.string().max(300) }))
    .max(20),
});

export const QUESTIONS_SYSTEM = `You help a candidate prepare for a job interview.
Write likely interview questions for this specific role: technical questions about the skills in the job description,
role-specific questions about the responsibilities, and behavioural questions. Keep each question to one sentence.
Do not answer them.`;

let counter = 0;
export function questionId(): string {
  counter = (counter + 1) % 1_000_000;
  return `q_${Date.now().toString(36)}_${counter.toString(36)}`;
}

const BEHAVIOURAL = [
  "Tell me about yourself and why you are interested in this role.",
  "Describe a project you are proud of. What was your part in it?",
  "Tell me about a time you disagreed with a teammate. How did you resolve it?",
  "Describe a time you missed a deadline or made a mistake. What did you learn?",
  "How do you prioritise when several things are urgent?",
];

/** Questions built from the skills list when no LLM key is set. */
export function templateQuestions(jobTitle: string, company: string, skills: string[]): PrepQuestion[] {
  const technical = skills.slice(0, 6).map((s) => `How have you used ${s} in a real project, and what trade-offs did you make?`);
  const role = [
    `What would you focus on in your first 90 days as ${jobTitle}?`,
    `What do you know about ${company}, and why do you want to work there?`,
    `Walk me through how you would approach a typical task for a ${jobTitle}.`,
  ];
  return [
    ...technical.map((q) => ({ type: "technical" as const, q })),
    ...role.map((q) => ({ type: "role" as const, q })),
    ...BEHAVIOURAL.map((q) => ({ type: "behavioural" as const, q })),
  ].map(({ type, q }) => ({ id: questionId(), type, question: q, answer: "", draft: true }));
}

export const DEFAULT_CHECKLIST = [
  "Confirm interview date, time and link",
  "Note the round type and interviewer names",
  "Keep resume, ID and certificates ready",
  "Prepare three questions to ask them",
  "Test camera, microphone and internet",
];

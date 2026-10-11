import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrepEditor } from "@/components/prep/prep-editor";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { ensurePrep } from "@/lib/prep/create";
import type { PrepQuestion } from "@/lib/prep/questions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Interview prep" };

export default async function PrepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const app = await db.application.findFirst({
    where: { id, userId: user.id },
    include: { job: { include: { company: true } } },
  });
  if (!app) notFound();
  const prep = await ensurePrep(app.id, user.id);

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 md:px-8">
      <Link href="/applications" className="mb-3 inline-flex min-h-11 items-center gap-1 text-accent md:min-h-0">
        <ArrowLeft className="size-4" aria-hidden /> Applications
      </Link>
      <h1 className="text-page font-semibold">Interview prep</h1>
      <p className="text-muted">
        <Link href={`/jobs/${app.jobId}`} className="text-foreground hover:underline">
          {app.job.title}
        </Link>{" "}
        at{" "}
        <Link href={`/companies/${app.job.companyId}`} className="text-foreground hover:underline">
          {app.job.company.name}
        </Link>
      </p>
      {!features.llm ? (
        <p className="mt-3 rounded-[8px] border border-border px-3 py-2 text-small text-muted">
          AI drafting is off, so questions come from templates. Everything here works as your own notes.
        </p>
      ) : null}
      <PrepEditor
        applicationId={app.id}
        initial={{
          roleSummary: prep.roleSummary,
          skillsGap: prep.skillsGap,
          studyList: prep.studyList,
          questions: prep.questions as unknown as PrepQuestion[],
          companyNotes: prep.companyNotes,
          checklist: prep.checklist as unknown as { id: string; label: string; done: boolean }[],
          interviewAt: prep.interviewAt?.toISOString() ?? null,
          roundType: prep.roundType,
          interviewers: prep.interviewers,
          roundNotes: prep.roundNotes,
        }}
      />
    </div>
  );
}

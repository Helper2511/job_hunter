import type { Metadata } from "next";
import { Tracker } from "@/components/applications/tracker";
import type { TrackerCard } from "@/lib/applications";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const user = await requireUser();
  const rows = await db.application.findMany({
    where: { userId: user.id },
    include: { job: { include: { company: { select: { name: true } } } }, prep: { select: { interviewAt: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const cards: TrackerCard[] = rows.map((a) => ({
    id: a.id,
    jobId: a.jobId,
    status: a.status,
    title: a.job.title,
    company: a.job.company.name,
    appliedAt: a.appliedAt.toISOString(),
    followUpAt: a.followUpAt?.toISOString() ?? null,
    interviewAt: a.prep?.interviewAt?.toISOString() ?? null,
    hasPrep: Boolean(a.prep),
  }));

  return (
    <div className="px-4 py-6 md:px-6">
      <h1 className="text-page font-semibold">Applications</h1>
      <p className="mb-4 text-muted">Drag cards between columns, or use the menu on each card.</p>
      <Tracker initial={cards} />
    </div>
  );
}

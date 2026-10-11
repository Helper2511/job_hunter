import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyPanel } from "@/components/apply/apply-panel";
import { JobActions } from "@/components/jobs/job-actions";
import { placeLabel } from "@/lib/jobs/format";
import { CareerPageOnlyTag, StatusBadge } from "@/components/ui/badge";
import { COMPANY_TYPE_LABEL, MAX_DAILY_EMAILS, SOURCE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { pickResume, splitDescription } from "@/lib/jobs/detail";
import { getUsage } from "@/lib/limits";
import { formatSalary } from "@/lib/matching/normalize";
import { getGoogleAccount, hasGmailSend, requireUser } from "@/lib/session";
import { relativeDate } from "@/lib/utils";

type Params = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = await db.job.findUnique({ where: { id }, select: { title: true, company: { select: { name: true } } } });
  return { title: job ? `${job.title} at ${job.company.name}` : "Job" };
}

export default async function JobDetail({ params, searchParams }: Params) {
  const { id } = await params;
  const back = new URLSearchParams(await searchParams).toString();
  const user = await requireUser();
  const job = await db.job.findUnique({ where: { id }, include: { company: true } });
  if (!job) notFound();

  const [siblings, applications, resumes, correction, google, emailsSent, hidden] = await Promise.all([
    db.job.findMany({ where: { dedupeKey: job.dedupeKey }, select: { id: true, source: true, url: true, closedAt: true, lastSeenAt: true } }),
    db.application.findMany({ where: { userId: user.id, job: { dedupeKey: job.dedupeKey } }, select: { id: true, status: true } }),
    db.resume.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, label: true, roleType: true, isDefault: true, fileName: true } }),
    db.companyTypeCorrection.findUnique({ where: { userId_companyId: { userId: user.id, companyId: job.companyId } } }),
    getGoogleAccount(user.id),
    getUsage(user.id, "email"),
    db.hiddenJob.findUnique({ where: { userId_jobId: { userId: user.id, jobId: job.id } } }),
  ]);

  const application = applications.find((a) => a.status !== "SAVED") ?? applications[0] ?? null;
  const type = correction?.type ?? job.company.companyType;
  const { about, requirements } = splitDescription(job.description);
  const careerRow = siblings.find((s) => s.source === "career_page");
  const mayBeClosed = Boolean(job.closedAt) || (job.company.checkStatus === "ok" && job.visibility === "PLATFORM_ONLY");
  const meta = [placeLabel(job)];
  if (job.workMode !== "remote") meta.push(WORK_MODE_LABEL[job.workMode] ?? "Not specified");
  meta.push(relativeDate(job.postedAt ?? job.firstSeenAt));
  const salary = formatSalary(job.salaryText);
  const defaultResume = pickResume(resumes, job.title);
  const gmailConnected = hasGmailSend(google?.scope);

  const applyPanel = (
    <ApplyPanel
      job={{
        id: job.id,
        title: job.title,
        company: job.company.name,
        applyUrl: careerRow?.url ?? job.applyUrl ?? job.url,
        hrEmail: job.company.hrEmail,
        careersUrl: job.company.careersUrl,
      }}
      resumes={resumes}
      defaultResumeId={defaultResume?.id ?? null}
      profile={{ name: user.name, email: user.email, phone: user.phone, noticePeriod: user.noticePeriod, linkedinUrl: user.linkedinUrl }}
      gmail={{ connected: gmailConnected, address: user.gmailAddress, googleConfigured: features.google }}
      emailsLeft={Math.max(0, Math.min(user.dailyEmailLimit, MAX_DAILY_EMAILS) - emailsSent)}
      status={application?.status ?? null}
    />
  );

  return (
    <article className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:px-8 md:pt-6 lg:pb-10">
      <Link href={`/jobs${back ? `?${back}` : ""}`} className="mb-3 inline-flex min-h-11 items-center gap-1 text-accent lg:hidden">
        <ArrowLeft className="size-4" aria-hidden /> All jobs
      </Link>

      <header>
        <h2 className="text-page font-semibold">{job.title}</h2>
        <p className="mt-1">
          <Link href={`/companies/${job.companyId}`} className="font-medium text-accent hover:underline">
            {job.company.name}
          </Link>
          {type !== "unknown" ? <span className="text-muted"> · {COMPANY_TYPE_LABEL[type]}</span> : null}
        </p>
        <p className="text-muted">{meta.join(" · ")}</p>
        {salary ? <p className="text-muted">{salary}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {job.visibility === "CAREER_PAGE_ONLY" ? <CareerPageOnlyTag /> : null}
          {application ? <StatusBadge status={application.status} /> : null}
        </div>
        {mayBeClosed ? <p className="mt-3 rounded-[8px] border border-border px-3 py-2 text-muted">This role may be closed. It is no longer on the company site.</p> : null}
      </header>

      <div className="mt-4 hidden flex-wrap gap-2 lg:flex">
        {applyPanel}
        <JobActions jobId={job.id} saved={Boolean(application)} hidden={Boolean(hidden)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
        <JobActions jobId={job.id} saved={Boolean(application)} hidden={Boolean(hidden)} />
      </div>

      {about ? (
        <section className="mt-8">
          <h3 className="text-section font-semibold">About the role</h3>
          <div className="mt-2 max-w-[70ch] whitespace-pre-line">{about}</div>
        </section>
      ) : (
        <section className="mt-8">
          <h3 className="text-section font-semibold">About the role</h3>
          <p className="mt-2 text-muted">The listing did not include a description. Open the original posting for details.</p>
        </section>
      )}

      {requirements ? (
        <section className="mt-8">
          <h3 className="text-section font-semibold">Requirements</h3>
          <div className="mt-2 max-w-[70ch] whitespace-pre-line">{requirements}</div>
        </section>
      ) : null}

      <section className="mt-8">
        <h3 className="text-section font-semibold">Company</h3>
        <p className="mt-2">
          {job.company.name}
          {job.company.industry ? <span className="text-muted"> · {job.company.industry}</span> : null}
        </p>
        {job.company.companyTypeReason ? <p className="text-muted">{job.company.companyTypeReason}</p> : null}
        <Link href={`/companies/${job.companyId}`} className="mt-1 inline-flex min-h-11 items-center text-accent hover:underline md:min-h-0">
          See all openings at {job.company.name}
        </Link>
      </section>

      <section className="mt-8">
        <h3 className="text-section font-semibold">Where this job was seen</h3>
        <ul className="mt-2 flex flex-col gap-1">
          {siblings.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-accent hover:underline md:min-h-0">
                {SOURCE_LABEL[s.source]?.label ?? s.source}
                <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <span className="text-small text-muted"> · last seen {relativeDate(s.lastSeenAt)}{s.closedAt ? " · no longer listed" : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Phones: a sticky Apply button at the bottom. */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 border-t border-border bg-surface p-3 md:bottom-0 lg:hidden">
        <div className="mx-auto max-w-3xl">{applyPanel}</div>
      </div>
    </article>
  );
}

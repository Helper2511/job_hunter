import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangeTypeMenu, CompanyActions } from "@/components/companies/company-header-actions";
import { placeLabel } from "@/lib/jobs/format";
import { CareerPageOnlyTag } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMPANY_TYPE_LABEL, SOURCE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { CORRECTION_QUORUM } from "@/lib/companies/corrections";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { relativeDate } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const c = await db.company.findUnique({ where: { id }, select: { name: true } });
  return { title: c?.name ?? "Company" };
}

type JobRow = { id: string; title: string; cities: string[]; location: string | null; workMode: string; remoteScope: string | null; visibility: string; source: string; postedAt: Date | null; firstSeenAt: Date };

function JobList({ jobs, empty }: { jobs: JobRow[]; empty: string }) {
  if (!jobs.length) return <p className="rounded-[8px] border border-dashed border-border p-4 text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {jobs.map((j) => {
        const meta = [placeLabel(j)];
        if (j.workMode !== "remote") meta.push(WORK_MODE_LABEL[j.workMode] ?? "Not specified");
        meta.push(relativeDate(j.postedAt ?? j.firstSeenAt, new Date(), true));
        return (
          <li key={j.id}>
            <Link href={`/jobs/${j.id}`} className="block rounded-[8px] border border-border bg-surface p-4 hover:border-border-strong">
              <p className="font-semibold">{j.title}</p>
              <p className="text-small text-muted">{meta.join(" · ")}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                {j.visibility === "CAREER_PAGE_ONLY" ? <CareerPageOnlyTag /> : <span />}
                {j.source !== "career_page" ? <span className="text-small text-muted">{SOURCE_LABEL[j.source]?.label}</span> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CompanyPage({ params }: Params) {
  const { id } = await params;
  const user = await requireUser();
  const company = await db.company.findUnique({ where: { id } });
  if (!company) notFound();
  const [jobs, watch, correction] = await Promise.all([
    db.job.findMany({ where: { companyId: id, closedAt: null }, orderBy: { firstSeenAt: "desc" } }),
    db.companyWatch.findUnique({ where: { userId_companyId: { userId: user.id, companyId: id } } }),
    db.companyTypeCorrection.findUnique({ where: { userId_companyId: { userId: user.id, companyId: id } } }),
  ]);
  const career = jobs.filter((j) => j.source === "career_page");
  const platform = jobs.filter((j) => j.source !== "career_page");
  const type = correction?.type ?? company.companyType;
  const reason =
    !correction || correction.status === "accepted"
      ? company.companyTypeReason
      : `Set by you. It changes for everyone once ${CORRECTION_QUORUM} people agree.`;

  const careerEmpty =
    company.checkStatus === "manual"
      ? "This careers page can’t be read automatically. Check manually using the link above."
      : company.checkStatus === "error"
        ? `The last check failed. ${company.lastChecked ? `Showing roles from ${relativeDate(company.lastChecked)}.` : "Try again later."}`
        : company.lastChecked
          ? "No open roles on the career page right now."
          : "Not checked yet. Use “Check now”.";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <Link href="/companies" className="mb-3 inline-flex min-h-11 items-center gap-1 text-accent md:min-h-0">
        <ArrowLeft className="size-4" aria-hidden /> Companies
      </Link>
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-page font-semibold">{company.name}</h1>
          <p className="mt-1">
            {type === "unknown" ? (
              <>
                <span className="text-muted">Not classified</span> · <ChangeTypeMenu companyId={company.id} label="Set type" />
              </>
            ) : (
              <>
                <span className="font-medium">{COMPANY_TYPE_LABEL[type]}</span>
                {company.industry ? <span className="text-muted"> · {company.industry}</span> : null} ·{" "}
                <ChangeTypeMenu companyId={company.id} label="Change" />
              </>
            )}
          </p>
          {reason ? <p className="text-small text-muted">{reason}</p> : null}
          <p className="mt-1 text-small text-muted">
            {company.lastChecked ? `Last checked ${relativeDate(company.lastChecked)}` : "Not checked yet"}
            {company.careersUrl ? (
              <>
                {" · "}
                <a href={company.careersUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                  {company.checkStatus === "manual" ? "Check manually" : "Careers page"} <ExternalLink className="size-3.5" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </>
            ) : null}
          </p>
        </div>
        <CompanyActions companyId={company.id} watching={Boolean(watch)} />
      </header>

      {/* Desktop: side by side. Mobile: tabs. */}
      <div className="mt-6 hidden gap-6 md:grid md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-section font-semibold">
            On the career page <span className="tabular text-muted">({career.length})</span>
          </h2>
          <JobList jobs={career} empty={careerEmpty} />
        </section>
        <section>
          <h2 className="mb-2 text-section font-semibold">
            On job platforms <span className="tabular text-muted">({platform.length})</span>
          </h2>
          <JobList jobs={platform} empty="No platform listings seen yet. They arrive through your forwarded job alerts." />
        </section>
      </div>
      <Tabs defaultValue="career" className="mt-6 md:hidden">
        <TabsList>
          <TabsTrigger value="career">Career page ({career.length})</TabsTrigger>
          <TabsTrigger value="platform">Platforms ({platform.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="career">
          <JobList jobs={career} empty={careerEmpty} />
        </TabsContent>
        <TabsContent value="platform">
          <JobList jobs={platform} empty="No platform listings seen yet. They arrive through your forwarded job alerts." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

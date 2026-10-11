import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AddCompany } from "@/components/companies/add-company";
import { CompanyTypeSelect } from "@/components/companies/type-filter";
import { EmptyState } from "@/components/ui/states";
import { COMPANY_TYPE_LABEL } from "@/lib/constants";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { relativeDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const user = await requireUser();
  const watches = await db.companyWatch.findMany({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
  const ids = watches.map((w) => w.companyId);
  const [counts, cpoCounts, corrections] = await Promise.all([
    db.job.groupBy({ by: ["companyId"], where: { companyId: { in: ids }, closedAt: null }, _count: { _all: true } }),
    db.job.groupBy({
      by: ["companyId"],
      where: { companyId: { in: ids }, closedAt: null, visibility: "CAREER_PAGE_ONLY" },
      _count: { _all: true },
    }),
    db.companyTypeCorrection.findMany({ where: { userId: user.id, companyId: { in: ids } } }),
  ]);
  const open = new Map(counts.map((c) => [c.companyId, c._count._all]));
  const cpo = new Map(cpoCounts.map((c) => [c.companyId, c._count._all]));
  const corrected = new Map(corrections.map((c) => [c.companyId, c.type]));

  const rows = watches
    .map((w) => ({ ...w.company, effectiveType: corrected.get(w.companyId) ?? w.company.companyType }))
    .filter((c) => !type || c.effectiveType === type);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <h1 className="text-page font-semibold">Companies</h1>
      <p className="mb-4 text-muted">Your watchlist. Career pages are checked once a day.</p>
      <AddCompany />

      <div className="mt-6 flex items-center justify-between gap-2">
        <h2 className="text-section font-semibold">
          Watchlist <span className="tabular text-muted">({rows.length})</span>
        </h2>
        <Suspense>
          <CompanyTypeSelect />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-3"
          message={type ? "No companies of this type on your watchlist." : "No companies yet. Add one above to check its careers page."}
          action={type ? <Link className="text-accent hover:underline" href="/companies">Show all types</Link> : undefined}
        />
      ) : (
        <>
          {/* Desktop: table */}
          <table className="mt-3 hidden w-full border-separate border-spacing-0 overflow-hidden rounded-[8px] border border-border bg-surface md:table">
            <thead>
              <tr className="text-left text-small text-muted">
                <th className="border-b border-border px-4 py-2 font-medium">Company</th>
                <th className="border-b border-border px-4 py-2 font-medium">Type</th>
                <th className="border-b border-border px-4 py-2 text-right font-medium">Open roles</th>
                <th className="border-b border-border px-4 py-2 text-right font-medium">Career page only</th>
                <th className="border-b border-border px-4 py-2 font-medium">Last checked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-background">
                  <td className="border-b border-border px-4 py-3 last:border-0">
                    <Link href={`/companies/${c.id}`} className="font-medium text-accent hover:underline">
                      {c.name}
                    </Link>
                    {c.domain ? <span className="block text-small text-muted">{c.domain}</span> : null}
                  </td>
                  <td className={`border-b border-border px-4 py-3 ${c.effectiveType === "unknown" ? "text-muted" : ""}`}>
                    {COMPANY_TYPE_LABEL[c.effectiveType]}
                  </td>
                  <td className="tabular border-b border-border px-4 py-3 text-right">{open.get(c.id) ?? 0}</td>
                  <td className="tabular border-b border-border px-4 py-3 text-right">{cpo.get(c.id) ?? 0}</td>
                  <td className="border-b border-border px-4 py-3 text-muted">
                    {c.checkStatus === "manual" ? "Check manually" : c.lastChecked ? relativeDate(c.lastChecked) : "Not yet"}
                    {c.checkStatus === "error" ? <span className="block text-small text-danger">Last check failed</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: cards */}
          <ul className="mt-3 flex flex-col gap-2 md:hidden">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/companies/${c.id}`} className="block rounded-[8px] border border-border bg-surface p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-small text-muted">{COMPANY_TYPE_LABEL[c.effectiveType]}</p>
                  <p className="tabular text-small text-muted">
                    {open.get(c.id) ?? 0} open · {cpo.get(c.id) ?? 0} career page only ·{" "}
                    {c.checkStatus === "manual" ? "check manually" : c.lastChecked ? `checked ${relativeDate(c.lastChecked)}` : "not checked yet"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

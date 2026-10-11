"use client";

import { ExternalLink, Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { saveJob, unsaveJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { platformSearchLinks } from "@/lib/deeplinks";
import type { JobCardData } from "@/lib/jobs/search";
import { activeFilterCount, queryToParams } from "@/lib/matching/query";
import type { JobQuery } from "@/lib/providers/types";
import { cn } from "@/lib/utils";
import { AddJobDialog } from "./add-job-dialog";
import { CompanyTypeChips, CompanyTypeFilter } from "./company-type-filter";
import { JobCard } from "./job-card";
import { LocationPicker } from "./location-picker";
import { MoreFilterFields } from "./more-filters";
import { SavedSearches, type SavedSearchItem } from "./saved-searches";
import { useJobQuery } from "./use-job-query";
import { WorkModeChips } from "./work-mode-chips";

interface Props {
  children: React.ReactNode;
  defaults: Partial<JobQuery>;
  savedCities: string[];
  savedSearches: SavedSearchItem[];
}

type Result = { key: string } & ({ status: "error" } | { status: "ready"; jobs: JobCardData[]; truncated: boolean });
type State = { status: "loading" } | Result;

const PAGE_SIZE = 200;
const MAX_JOBS = 1000;

export function JobsWorkspace({ children, defaults, savedCities, savedSearches }: Props) {
  const { query, setQuery, queryString } = useJobQuery();
  const pathname = usePathname();
  const router = useRouter();
  const selectedId = pathname.startsWith("/jobs/") ? pathname.split("/")[2] : null;
  const [reload, setReload] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [limitFor, setLimitFor] = useState(queryString);
  if (limitFor !== queryString) {
    // New filters start again from the first page.
    setLimitFor(queryString);
    setLimit(PAGE_SIZE);
  }
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = `${queryString}#${reload}#${limit}`;
  // While "Load more" runs, keep showing the jobs already loaded for these filters.
  const loadingMore = Boolean(result && result.key !== requestKey && result.status === "ready" && result.key.startsWith(`${queryString}#${reload}#`));
  const state: State = result && (result.key === requestKey || loadingMore) ? result : { status: "loading" };
  const [keywords, setKeywords] = useState(query.keywords);
  const [syncedKeywords, setSyncedKeywords] = useState(query.keywords);
  if (syncedKeywords !== query.keywords) {
    setSyncedKeywords(query.keywords);
    setKeywords(query.keywords);
  }
  const [sheetOpen, setSheetOpen] = useState(false);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const appliedDefaults = useRef(false);

  // First visit with an empty URL: start from the preferences set in onboarding.
  useEffect(() => {
    if (appliedDefaults.current) return;
    appliedDefaults.current = true;
    if (!queryString && Object.keys(defaults).length) setQuery(defaults, { replace: true });
  }, [defaults, queryString, setQuery]);

  useEffect(() => {
    const controller = new AbortController();
    const key = `${queryString}#${reload}#${limit}`;
    const params = new URLSearchParams(queryString);
    params.set("limit", String(limit));
    fetch(`/api/jobs/search?${params}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = (await r.json()) as { jobs: JobCardData[]; truncated: boolean };
        setResult({ key, status: "ready", ...data });
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") setResult({ key, status: "error" });
      });
    return () => controller.abort();
  }, [queryString, reload, limit]);

  const jobs = state.status === "ready" ? state.jobs : [];
  const href = useCallback((id: string) => `/jobs/${id}${queryString ? `?${queryString}` : ""}`, [queryString]);

  const onSave = async (job: JobCardData) => {
      setResult((s) => (s && s.status === "ready" ? { ...s, jobs: s.jobs.map((j) => (j.id === job.id ? { ...j, status: "SAVED" } : j)) } : s));
      try {
        await saveJob(job.id);
        toast.success("Saved", {
          action: {
            label: "Undo",
            onClick: async () => {
              await unsaveJob(job.id);
              setReload((n) => n + 1);
            },
          },
        });
      } catch {
        toast.error("Could not save this job. Try again.");
        setReload((n) => n + 1);
      }
  };

  // Up and Down move between jobs; Enter opens one (native link behaviour).
  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const idx = cardRefs.current.findIndex((el) => el === document.activeElement);
    const next = e.key === "ArrowDown" ? Math.min(jobs.length - 1, idx + 1) : Math.max(0, idx - 1);
    if (idx === -1 && jobs.length) {
      cardRefs.current[0]?.focus();
      e.preventDefault();
      return;
    }
    cardRefs.current[next]?.focus();
    cardRefs.current[next]?.scrollIntoView({ block: "nearest" });
    e.preventDefault();
  }

  const filterCount = activeFilterCount(query);
  const firstLocation = query.locations?.find((l) => !/anywhere/i.test(l));
  const deepLinks = useMemo(
    () => (query.keywords ? platformSearchLinks(query.keywords, firstLocation, query.workModes) : []),
    [query.keywords, firstLocation, query.workModes],
  );

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      {/* Filter bar: fixed at the top while the list scrolls. */}
      <div className={cn("sticky top-0 z-20 border-b border-border bg-background px-4 py-3 md:px-6", selectedId && "hidden lg:block")}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery({ keywords: keywords.trim() });
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              type="search"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Search role or keyword"
              aria-label="Search role or keyword"
              className="pl-9"
            />
          </div>
          <SavedSearches items={savedSearches} current={query} />
        </form>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <WorkModeChips value={query.workModes ?? []} onChange={(workModes) => setQuery({ workModes })} />
          <div className="hidden items-center gap-2 md:flex md:flex-wrap">
            <LocationPicker
              value={query.locations ?? []}
              onChange={(locations) => setQuery({ locations, radiusKm: locations.length === 1 ? query.radiusKm : undefined })}
              savedCities={savedCities}
              radiusKm={query.radiusKm}
              onRadiusChange={(radiusKm) => setQuery({ radiusKm })}
            />
            <CompanyTypeFilter
              value={query.companyTypes ?? []}
              hideUnclassified={Boolean(query.hideUnclassified)}
              onChange={(companyTypes, hideUnclassified) => setQuery({ companyTypes, hideUnclassified: hideUnclassified || undefined })}
            />
            <Popover>
              <PopoverTrigger className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3.5">
                <SlidersHorizontal className="size-4" aria-hidden /> More
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <MoreFilterFields query={query} onChange={(patch) => setQuery(patch)} />
              </PopoverContent>
            </Popover>
            {filterCount > 0 ? (
              <Button variant="quiet" size="sm" onClick={() => router.push(`/jobs?${queryToParams({ keywords: query.keywords })}`)}>
                Clear filters
              </Button>
            ) : null}
          </div>
          <div className="md:hidden">
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal aria-hidden /> Filters{filterCount ? ` ${filterCount}` : ""}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* List pane: 420px on desktop; the whole screen on phones and tablets. */}
        <section
          aria-label="Jobs"
          className={cn("min-w-0 flex-1 overflow-y-auto px-4 py-3 md:px-6 lg:w-[420px] lg:flex-none lg:border-r lg:border-border lg:px-4", selectedId && "hidden lg:block")}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="tabular text-small text-muted" aria-live="polite">
              {state.status === "ready" ? `${jobs.length}${state.truncated ? "+" : ""} jobs · sorted by newest` : state.status === "loading" ? "Loading jobs…" : ""}
            </p>
            <AddJobDialog
              trigger={
                <Button variant="quiet" size="sm">
                  <Plus aria-hidden /> Add job
                </Button>
              }
            />
          </div>

          {state.status === "loading" ? (
            <div className="flex flex-col gap-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[8px] border border-border bg-surface p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                  <Skeleton className="mt-1 h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : state.status === "error" ? (
            <ErrorState
              message="Jobs could not be loaded. Check your connection."
              action={<Button onClick={() => setReload((n) => n + 1)}>Retry</Button>}
            />
          ) : jobs.length === 0 ? (
            <EmptyState
              message={filterCount || query.keywords ? "No jobs match these filters." : "No jobs yet. Add a company to your watchlist or set up alert forwarding."}
              action={
                filterCount || query.keywords ? (
                  <Button onClick={() => router.push("/jobs?all=1")}>Clear filters</Button>
                ) : (
                  <Button asChild variant="primary">
                    <Link href="/companies">Add a company</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className="flex flex-col gap-2" onKeyDown={onListKeyDown}>
              {jobs.map((job, i) => (
                <li key={job.id}>
                  <JobCard
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    job={job}
                    href={href(job.id)}
                    selected={job.id === selectedId}
                    onSave={onSave}
                  />
                </li>
              ))}
            </ul>
          )}

          {state.status === "ready" && state.truncated && limit < MAX_JOBS ? (
            <div className="mt-3 flex justify-center">
              <Button variant="secondary" disabled={loadingMore} onClick={() => setLimit((n) => Math.min(n + PAGE_SIZE, MAX_JOBS))}>
                {loadingMore ? "Loading…" : "Load more jobs"}
              </Button>
            </div>
          ) : state.status === "ready" && state.truncated ? (
            <p className="mt-3 text-center text-small text-muted">Showing the newest {MAX_JOBS}. Add a filter to narrow the list.</p>
          ) : null}

          {deepLinks.length ? (
            <div className="mt-4 rounded-[8px] border border-border p-3">
              <p className="text-small text-muted">Search “{query.keywords}” on the platforms too:</p>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {deepLinks.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-accent hover:underline md:min-h-0">
                      {l.label} <ExternalLink className="size-3.5" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Detail pane: the rest of the width on desktop; a full page on smaller screens. */}
        <section aria-label="Job detail" className={cn("min-w-0 flex-1 overflow-y-auto", !selectedId && "hidden lg:block")}>
          {children}
        </section>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" title="Filters">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="mb-2 font-medium">Work mode</h3>
              <WorkModeChips value={query.workModes ?? []} onChange={(workModes) => setQuery({ workModes }, { replace: true })} />
            </section>
            <section>
              <h3 className="mb-2 font-medium">Location</h3>
              <LocationPicker
                inline
                value={query.locations ?? []}
                onChange={(locations) => setQuery({ locations }, { replace: true })}
                savedCities={savedCities}
                radiusKm={query.radiusKm}
                onRadiusChange={(radiusKm) => setQuery({ radiusKm }, { replace: true })}
              />
            </section>
            <section>
              <h3 className="mb-2 font-medium">Company type</h3>
              <CompanyTypeChips value={query.companyTypes ?? []} onChange={(companyTypes) => setQuery({ companyTypes }, { replace: true })} />
            </section>
            <MoreFilterFields query={query} onChange={(patch) => setQuery(patch, { replace: true })} />
            <div className="sticky -bottom-4 -mx-4 flex gap-2 border-t border-border bg-surface px-4 pb-4 pt-3">
              <Button variant="quiet" className="flex-1" onClick={() => router.replace(`/jobs?all=1`)}>
                Clear all
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setSheetOpen(false)}>
                Show jobs
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

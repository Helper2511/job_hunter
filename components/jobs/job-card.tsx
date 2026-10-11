"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { forwardRef } from "react";
import { CareerPageOnlyTag, StatusBadge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { COMPANY_TYPE_LABEL, SOURCE_LABEL, WORK_MODE_LABEL } from "@/lib/constants";
import { placeLabel } from "@/lib/jobs/format";
import type { JobCardData } from "@/lib/jobs/search";
import { cn, relativeDate } from "@/lib/utils";

export function SourceBadges({ sources }: { sources: string[] }) {
  return (
    <ul className="flex gap-1" aria-label="Seen on">
      {sources.map((s) => (
        <li key={s}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex h-6 min-w-7 items-center justify-center rounded-full bg-neutral-badge px-1.5 text-[13px] text-muted">
                {SOURCE_LABEL[s]?.short ?? s}
                <span className="sr-only">{SOURCE_LABEL[s]?.label ?? s}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent>{SOURCE_LABEL[s]?.label ?? s}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  job: JobCardData;
  href: string;
  selected: boolean;
  onSave: (job: JobCardData) => void;
  onFocusCard?: () => void;
}

export const JobCard = forwardRef<HTMLAnchorElement, Props>(function JobCard({ job, href, selected, onSave, onFocusCard }, ref) {
  const type = job.companyType !== "unknown" ? COMPANY_TYPE_LABEL[job.companyType] : null;
  const applied = job.status && job.status !== "SAVED";
  const meta = [placeLabel(job)];
  if (job.workMode !== "remote") meta.push(WORK_MODE_LABEL[job.workMode] ?? WORK_MODE_LABEL.unknown);
  meta.push(relativeDate(job.postedAt, new Date(), true));
  return (
    <article
      className={cn(
        "relative rounded-[8px] border bg-surface transition-colors duration-150",
        selected ? "border-accent bg-accent-soft/30 shadow-[inset_3px_0_0_var(--accent)]" : "border-border hover:border-border-strong",
      )}
    >
      <Link
        ref={ref}
        href={href}
        onFocus={onFocusCard}
        aria-current={selected ? "true" : undefined}
        className="block rounded-[8px] p-4 pr-14 focus-visible:outline-2 focus-visible:outline-accent md:p-5 md:pr-16"
        scroll={false}
      >
        <h3 className={cn("text-card font-semibold", applied && "text-muted")}>{job.title}</h3>
        <p className="text-small text-muted">
          <span className="text-foreground">{job.companyName}</span>
          {type ? ` · ${type}` : ""}
        </p>
        <p className="text-small text-muted">{meta.join(" · ")}</p>
        <div className="mt-2 flex min-h-6 items-center justify-between gap-2">
          {job.visibility === "CAREER_PAGE_ONLY" ? <CareerPageOnlyTag /> : <span />}
          <SourceBadges sources={job.sources} />
        </div>
      </Link>
      <div className="absolute right-2 top-2 md:right-3 md:top-3">
        {job.status ? (
          <StatusBadge status={job.status} />
        ) : (
          <button
            type="button"
            onClick={() => onSave(job)}
            className="inline-flex size-11 items-center justify-center rounded-[6px] text-muted hover:bg-border/50 hover:text-foreground md:size-9"
          >
            <Bookmark className="size-5" aria-hidden />
            <span className="sr-only">Save {job.title} at {job.companyName}</span>
          </button>
        )}
      </div>
    </article>
  );
});

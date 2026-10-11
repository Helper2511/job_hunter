"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { POSTED_WITHIN, SOURCES } from "@/lib/constants";
import type { JobQuery, JobSource } from "@/lib/providers/types";

/** Remote scope, experience, date posted, source, career page only, salary. */
export function MoreFilterFields({ query, onChange }: { query: JobQuery; onChange: (patch: Partial<JobQuery>) => void }) {
  const [expMin, expMax] = query.experienceYears ?? [undefined, undefined];
  const sources = query.sources ?? [];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-scope">Remote scope</Label>
        <NativeSelect
          id="f-scope"
          value={query.remoteScope ?? ""}
          onChange={(e) => onChange({ remoteScope: (e.target.value || undefined) as JobQuery["remoteScope"] })}
        >
          <option value="">Any remote role</option>
          <option value="india">Remote in India</option>
          <option value="worldwide">Remote worldwide</option>
        </NativeSelect>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[13px] font-medium">Experience (years)</legend>
        <div className="flex items-center gap-2">
          <NativeSelect
            aria-label="Minimum years"
            value={expMin ?? ""}
            onChange={(e) => {
              const min = e.target.value === "" ? undefined : Number(e.target.value);
              onChange({ experienceYears: min === undefined && expMax === undefined ? undefined : [min ?? 0, expMax ?? 30] });
            }}
          >
            <option value="">Any</option>
            {[0, 1, 2, 3, 4, 5, 7, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
          <span className="text-muted">to</span>
          <NativeSelect
            aria-label="Maximum years"
            value={expMax ?? ""}
            onChange={(e) => {
              const max = e.target.value === "" ? undefined : Number(e.target.value);
              onChange({ experienceYears: max === undefined && expMin === undefined ? undefined : [expMin ?? 0, max ?? 30] });
            }}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 7, 10, 15, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-posted">Date posted</Label>
        <NativeSelect
          id="f-posted"
          value={query.postedWithinDays ?? ""}
          onChange={(e) => onChange({ postedWithinDays: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">Any time</option>
          {POSTED_WITHIN.map((p) => (
            <option key={p.value} value={p.value}>
              Last {p.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">Source</legend>
        <div className="grid grid-cols-2 gap-2">
          {SOURCES.filter((s) => s.value !== "aggregator").map((s) => (
            <label key={s.value} className="flex min-h-11 items-center gap-2 md:min-h-8">
              <Checkbox
                checked={sources.includes(s.value)}
                onCheckedChange={(on) =>
                  onChange({ sources: on ? [...sources, s.value] : sources.filter((v: JobSource) => v !== s.value) })
                }
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-2 md:min-h-8">
        <Checkbox checked={Boolean(query.careerPageOnly)} onCheckedChange={(on) => onChange({ careerPageOnly: Boolean(on) || undefined })} />
        Career page only
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="f-salary">Minimum salary (when listed)</Label>
        <NativeSelect
          id="f-salary"
          value={query.salaryMin ?? ""}
          onChange={(e) => onChange({ salaryMin: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">Any</option>
          {[3, 6, 10, 15, 20, 30, 50].map((l) => (
            <option key={l} value={l * 100_000}>
              {l} LPA
            </option>
          ))}
        </NativeSelect>
      </div>

      <label className="flex min-h-11 items-center gap-2 md:min-h-8">
        <Checkbox
          checked={Boolean(query.hideUnknownWorkMode)}
          onCheckedChange={(on) => onChange({ hideUnknownWorkMode: Boolean(on) || undefined })}
        />
        Hide jobs with no work mode stated
      </label>
    </div>
  );
}

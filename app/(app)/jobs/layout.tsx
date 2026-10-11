import { Suspense } from "react";
import { JobsWorkspace } from "@/components/jobs/jobs-workspace";
import type { SavedSearchItem } from "@/components/jobs/saved-searches";
import { db } from "@/lib/db";
import { jobQuerySchema } from "@/lib/matching/query";
import type { JobQuery } from "@/lib/providers/types";
import { requireUser } from "@/lib/session";

export default async function JobsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const searches = await db.savedSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const savedSearches: SavedSearchItem[] = searches.flatMap((s) => {
    const q = jobQuerySchema.safeParse(s.query);
    return q.success ? [{ id: s.id, name: s.name, notify: s.notify, query: q.data as JobQuery }] : [];
  });

  const defaults: Partial<JobQuery> = {};
  if (user.workModes.length) defaults.workModes = user.workModes as JobQuery["workModes"];
  if (user.locations.length) defaults.locations = user.locations;

  return (
    <>
      <h1 className="sr-only">Jobs</h1>
      <Suspense>
        <JobsWorkspace defaults={defaults} savedCities={user.locations} savedSearches={savedSearches}>
          {children}
        </JobsWorkspace>
      </Suspense>
    </>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { queryFromParams, queryToParams } from "@/lib/matching/query";
import type { JobQuery } from "@/lib/providers/types";

/** Filters live in the URL so searches can be shared and the back button works. */
export function useJobQuery() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const query = useMemo(() => queryFromParams(params), [params]);
  const queryString = params.toString();

  const setQuery = useCallback(
    (patch: Partial<JobQuery>, opts: { replace?: boolean } = {}) => {
      const next = queryToParams({ ...query, ...patch }).toString();
      // Changing filters returns to the list on phones.
      const base = pathname.startsWith("/jobs/") && window.matchMedia("(max-width: 1023px)").matches ? "/jobs" : pathname;
      const url = next ? `${base}?${next}` : base;
      if (opts.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [query, pathname, router],
  );

  return { query, setQuery, queryString };
}

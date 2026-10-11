import { politeJson } from "@/lib/http";
import type { RawPosting } from "./types";

interface AshbyResponse {
  jobs: {
    title: string;
    location?: string;
    secondaryLocations?: { location?: string }[];
    isRemote?: boolean;
    workplaceType?: string; // OnSite | Remote | Hybrid
    jobUrl: string;
    applyUrl?: string;
    publishedAt?: string;
    descriptionPlain?: string;
    isListed?: boolean;
    address?: { postalAddress?: { addressCountry?: string } };
    compensation?: { compensationTierSummary?: string };
  }[];
}

export function mapAshby(data: AshbyResponse): RawPosting[] {
  return (data.jobs ?? [])
    .filter((j) => j.isListed !== false)
    .map((j) => ({
      title: j.title,
      url: j.jobUrl,
      applyUrl: j.applyUrl ?? j.jobUrl,
      location: [j.location, ...(j.secondaryLocations ?? []).map((l) => l.location)].filter(Boolean).join(" / ") || null,
      country: j.address?.postalAddress?.addressCountry ?? null,
      atsMode: j.workplaceType ?? (j.isRemote ? "remote" : null),
      description: j.descriptionPlain ?? null,
      postedAt: j.publishedAt ?? null,
      salaryText: j.compensation?.compensationTierSummary ?? null,
    }));
}

export async function fetchAshby(name: string): Promise<RawPosting[]> {
  const data = await politeJson<AshbyResponse>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(name)}?includeCompensation=true`,
  );
  return mapAshby(data);
}

import { politeJson } from "@/lib/http";
import type { RawPosting } from "./types";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  country?: string;
  workplaceType?: string; // on-site | remote | hybrid | unspecified
  descriptionPlain?: string;
  additionalPlain?: string;
  lists?: { text: string; content: string }[];
  categories?: { location?: string; allLocations?: string[]; commitment?: string; team?: string };
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
}

export function mapLever(data: LeverPosting[]): RawPosting[] {
  return (Array.isArray(data) ? data : []).map((p) => {
    const locations = p.categories?.allLocations?.length ? p.categories.allLocations : [p.categories?.location];
    const salary = p.salaryRange?.min
      ? `${p.salaryRange.currency ?? ""} ${p.salaryRange.min}${p.salaryRange.max ? ` - ${p.salaryRange.max}` : ""} ${p.salaryRange.interval ?? ""}`.trim()
      : null;
    return {
      title: p.text,
      url: p.hostedUrl,
      applyUrl: p.applyUrl ?? p.hostedUrl,
      location: locations.filter(Boolean).join(" / ") || null,
      atsMode: p.workplaceType && p.workplaceType !== "unspecified" ? p.workplaceType : null,
      description: [p.descriptionPlain, ...(p.lists ?? []).map((l) => `${l.text}\n${l.content.replace(/<[^>]+>/g, " ")}`), p.additionalPlain]
        .filter(Boolean)
        .join("\n\n"),
      postedAt: p.createdAt ?? null,
      salaryText: salary,
    };
  });
}

export async function fetchLever(company: string): Promise<RawPosting[]> {
  const data = await politeJson<LeverPosting[]>(`https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`);
  return mapLever(data);
}

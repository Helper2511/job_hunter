import * as cheerio from "cheerio";
import { htmlToText } from "@/lib/utils";

export interface JobPostingLd {
  title: string;
  url?: string;
  company?: string;
  companyUrl?: string;
  location?: string;
  country?: string;
  jobLocationType?: string;
  description?: string;
  datePosted?: string;
  salaryText?: string;
  experienceText?: string;
}

type Ld = Record<string, unknown>;

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function str(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return undefined;
}

function isJobPosting(node: Ld): boolean {
  return asArray(node["@type"] as string | string[]).some((t) => String(t).toLowerCase() === "jobposting");
}

function collect(node: unknown, out: Ld[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => collect(n, out));
    return;
  }
  const obj = node as Ld;
  if (isJobPosting(obj)) out.push(obj);
  if (obj["@graph"]) collect(obj["@graph"], out);
  if (obj.itemListElement) collect(asArray(obj.itemListElement as unknown[]).map((i) => (i as Ld)?.item ?? i), out);
}

function locationText(node: Ld): { text?: string; country?: string } {
  const parts: string[] = [];
  let country: string | undefined;
  for (const place of asArray(node.jobLocation as Ld | Ld[])) {
    const address = (place?.address ?? place) as Ld;
    if (typeof address === "string") {
      parts.push(address);
      continue;
    }
    const city = str(address?.addressLocality);
    const region = str(address?.addressRegion);
    const c = address?.addressCountry;
    country = country ?? (typeof c === "object" && c ? str((c as Ld).name) : str(c));
    parts.push([city, region].filter(Boolean).join(", "));
  }
  for (const req of asArray(node.applicantLocationRequirements as Ld | Ld[])) {
    const name = str(req?.name);
    if (name) parts.push(name);
  }
  const text = parts.filter(Boolean).join(" / ");
  return { text: text || undefined, country };
}

function salaryText(node: Ld): string | undefined {
  const base = node.baseSalary as Ld | undefined;
  if (!base) return undefined;
  const value = base.value as Ld | number | undefined;
  const currency = str(base.currency) ?? "";
  if (typeof value === "number") return `${currency} ${value}`.trim();
  if (value && typeof value === "object") {
    const min = str(value.minValue);
    const max = str(value.maxValue);
    const unit = str(value.unitText)?.toLowerCase() ?? "";
    if (min || max) return `${currency} ${[min, max].filter(Boolean).join(" - ")} ${unit}`.trim();
  }
  return undefined;
}

export function extractJobPostings(html: string, pageUrl?: string): JobPostingLd[] {
  const $ = cheerio.load(html);
  const found: Ld[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      collect(JSON.parse(raw), found);
    } catch {
      // Some sites ship invalid JSON-LD; skip it.
    }
  });
  return found
    .map((node): JobPostingLd | null => {
      const title = str(node.title) ?? str(node.name);
      if (!title) return null;
      const org = asArray(node.hiringOrganization as Ld | Ld[])[0];
      const loc = locationText(node);
      const desc = str(node.description);
      const exp = node.experienceRequirements as Ld | string | undefined;
      return {
        title,
        url: str(node.url) ?? pageUrl,
        company: typeof org === "string" ? org : str(org?.name),
        companyUrl: typeof org === "object" ? str(org?.sameAs) ?? str(org?.url) : undefined,
        location: loc.text,
        country: loc.country,
        jobLocationType: str(node.jobLocationType),
        description: desc ? htmlToText(desc) : undefined,
        datePosted: str(node.datePosted),
        salaryText: salaryText(node),
        experienceText:
          typeof exp === "string"
            ? exp
            : exp && typeof exp === "object"
              ? (str(exp.monthsOfExperience)
                  ? `${Math.round(Number(exp.monthsOfExperience) / 12)}+ years`
                  : str(exp.description))
              : undefined,
      };
    })
    .filter((j): j is JobPostingLd => j !== null);
}

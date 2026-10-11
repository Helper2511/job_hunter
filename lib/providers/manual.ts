import "server-only";
import { normalizePosting } from "@/lib/ats/types";
import { detectAts } from "@/lib/ats/detect";
import { ATS_FETCHERS } from "@/lib/ats";
import { FetchError, politeFetch } from "@/lib/http";
import { extractJobPostings } from "@/lib/jsonld";
import { nameFromDomain } from "@/lib/companies/resolve";
import type { JobSource, NormalizedJob } from "./types";
import * as cheerio from "cheerio";

function sourceForUrl(url: URL): JobSource {
  if (/linkedin\.com$/.test(url.hostname)) return "linkedin";
  if (/naukri\.com$/.test(url.hostname)) return "naukri";
  if (/glassdoor\./.test(url.hostname)) return "glassdoor";
  return "manual";
}

/** Paste any job URL: fetch the page once and read its JobPosting JSON-LD. */
export async function importJobFromUrl(input: string, fallback?: { title?: string; company?: string }): Promise<NormalizedJob> {
  const url = new URL(input);
  const source = sourceForUrl(url);

  // A single job on a known board: read it through the board's endpoint.
  const ats = detectAts(url.toString());
  if (ats && source === "manual") {
    const postings = await ATS_FETCHERS[ats.type](ats.token).catch(() => []);
    const match = postings.find((p) => p.url.split("?")[0] === url.toString().split("?")[0]);
    if (match) return { ...normalizePosting(match, { name: fallback?.company ?? nameFromDomain(ats.token) }), source: "manual" };
  }

  let html = "";
  try {
    html = (await politeFetch(url.toString())).body;
  } catch (err) {
    if (!fallback?.title || !fallback.company) throw err instanceof FetchError ? err : new FetchError("Could not read this page");
  }

  const ld = html ? extractJobPostings(html, url.toString())[0] : undefined;
  const $ = html ? cheerio.load(html) : null;
  const title = ld?.title ?? fallback?.title ?? $?.("meta[property='og:title']").attr("content") ?? $?.("title").text().trim();
  const company = ld?.company ?? fallback?.company ?? $?.("meta[property='og:site_name']").attr("content") ?? nameFromDomain(url.hostname.replace(/^www\./, ""));
  if (!title) throw new FetchError("Could not find a job on this page. Add the title and company yourself.");

  const companyDomain = ld?.companyUrl ? new URL(ld.companyUrl).hostname.replace(/^www\./, "") : source === "manual" ? url.hostname.replace(/^www\./, "") : null;
  return normalizePosting(
    {
      title,
      url: url.toString(),
      applyUrl: url.toString(),
      location: ld?.location ?? null,
      country: ld?.country ?? null,
      jsonLdLocationType: ld?.jobLocationType ?? null,
      description: ld?.description ?? null,
      postedAt: ld?.datePosted ?? null,
      salaryText: ld?.salaryText ?? null,
      experienceText: ld?.experienceText ?? null,
    },
    { name: company, domain: companyDomain },
    source,
  );
}

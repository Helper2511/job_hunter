import * as cheerio from "cheerio";
import { z } from "zod";
import { extractJobPostings } from "@/lib/jsonld";
import { htmlToText } from "@/lib/utils";
import type { RawPosting } from "./types";

const JOB_HREF = /(\/jobs?\/|\/careers?\/|\/positions?\/|\/openings?\/|\/vacanc|\/requisition|\/opportunit|\/role\/|jobid=|job_id=|gh_jid=)/i;
const NOT_A_TITLE = /^(apply|apply now|view|view job|view all|see all|learn more|read more|details|careers?|jobs?|join us|open positions|search|back|next|previous|home|login|sign in)$/i;
const ROLE_WORD = /(engineer|developer|manager|designer|analyst|scientist|lead|architect|specialist|consultant|executive|associate|intern|officer|administrator|tester|qa|sales|marketing|support|writer|recruiter|accountant|director|head|coordinator|representative|technician|operator|advisor|strategist|programmer|devops|sre)/i;

/** Step 3.1 of the checker: JobPosting JSON-LD blocks. */
export function postingsFromJsonLd(html: string, pageUrl: string): RawPosting[] {
  return extractJobPostings(html, pageUrl).map((j) => ({
    title: j.title,
    url: j.url ? new URL(j.url, pageUrl).toString() : pageUrl,
    location: j.location ?? null,
    country: j.country ?? null,
    jsonLdLocationType: j.jobLocationType ?? null,
    description: j.description ?? null,
    postedAt: j.datePosted ?? null,
    salaryText: j.salaryText ?? null,
    experienceText: j.experienceText ?? null,
  }));
}

/** Step 3.2: job cards from headings and links. */
export function postingsFromHtml(html: string, pageUrl: string): RawPosting[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const out: RawPosting[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!JOB_HREF.test(href) || href.startsWith("mailto:")) return;
    let url: string;
    try {
      url = new URL(href, pageUrl).toString();
    } catch {
      return;
    }
    if (url.replace(/\/$/, "") === pageUrl.replace(/\/$/, "")) return;
    const heading = $(el).find("h1,h2,h3,h4,h5,strong").first().text().trim();
    const title = (heading || $(el).text()).replace(/\s+/g, " ").trim();
    const words = title.split(" ").length;
    if (!title || NOT_A_TITLE.test(title) || words > 12 || title.length < 4) return;
    if (!ROLE_WORD.test(title) && words > 6) return;
    if (seen.has(url)) return;
    seen.add(url);
    const card = $(el).closest("li,article,tr,div");
    const cardText = card.text().replace(/\s+/g, " ").replace(title, "").trim();
    const location = cardText.match(/(remote|hybrid|[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*,?\s*(?:India|IN))/)?.[0] ?? null;
    out.push({ title, url, location });
  });
  return out;
}

export const llmPostingsSchema = z.object({
  jobs: z.array(z.object({ title: z.string(), location: z.string().nullable(), url: z.string().nullable() })),
});

/** Cleaned page text for the optional LLM pass. */
export function pageTextForLlm(html: string): string {
  return htmlToText(html).slice(0, 12_000);
}

/** Rendered client-side and nothing to read: an empty shell with a big script bundle. */
export function looksClientRendered(html: string): boolean {
  const text = htmlToText(html);
  const scripts = (html.match(/<script/gi) ?? []).length;
  return text.length < 400 && scripts > 3;
}

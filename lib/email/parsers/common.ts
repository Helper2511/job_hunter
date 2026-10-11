import * as cheerio from "cheerio";
import type { JobSource } from "@/lib/providers/types";

export interface ParsedAlertJob {
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: JobSource;
  salaryText?: string | null;
  experienceText?: string | null;
}

const SKIP_TEXT = /^(view job|view all|see all|apply|apply now|easy apply|unsubscribe|manage alerts?|view similar jobs|see more jobs|search other jobs|jobs|home|settings|help|privacy|view details|show more|\d+ (new )?jobs?)$/i;
const NOISE_LINE = /(promoted|actively recruiting|be an early applicant|easy apply|applicants?|\d+ connections?|alumni|ago$|^new$|^·$|^\s*$|reviews?$|^\d(\.\d)?★?$|^\d(\.\d)?$)/i;

export function cleanUrl(href: string): string {
  try {
    const u = new URL(href);
    const keep = ["jobId", "jl", "jobListingId", "currentJobId"];
    const params = new URLSearchParams();
    for (const k of keep) {
      const v = u.searchParams.get(k);
      if (v) params.set(k, v);
    }
    u.search = params.toString();
    u.hash = "";
    return u.toString();
  } catch {
    return href;
  }
}

function lines(text: string): string[] {
  return text
    .split(/\n|·|•|\|/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !NOISE_LINE.test(l));
}

/**
 * Generic HTML alert parser: every link matching `jobLink` is one job. The
 * link text (or the first heading in its card) is the title; the next lines in
 * the same card are company and location.
 */
export function parseHtmlAlert(
  html: string,
  opts: { source: JobSource; jobLink: RegExp; idFromUrl: (url: string) => string | null },
): ParsedAlertJob[] {
  const $ = cheerio.load(html);
  const byId = new Map<string, ParsedAlertJob>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!opts.jobLink.test(href)) return;
    const id = opts.idFromUrl(href);
    if (!id) return;
    const text = $(el).text().replace(/\s+/g, " ").trim();

    // Walk up to a container that holds title + company + location.
    let card = $(el).parent();
    for (let i = 0; i < 6 && card.length; i++) {
      if (lines(card.text()).length >= 3) break;
      card = card.parent();
    }
    const cardLines = lines(card.text());
    const title = text && !SKIP_TEXT.test(text) ? text : cardLines[0];
    if (!title || SKIP_TEXT.test(title)) return;

    const existing = byId.get(id);
    if (existing && existing.company) return;

    const after = cardLines.slice(cardLines.indexOf(title) + 1).filter((l) => l !== title);
    const salary = after.find((l) => /lpa|lakh|₹|\$|per (annum|year|month)/i.test(l)) ?? null;
    const experience = after.find((l) => /\d+\s*(-|to)\s*\d+\s*(yrs?|years?)|\d+\+?\s*(yrs?|years?)/i.test(l)) ?? null;
    const rest = after.filter((l) => l !== salary && l !== experience);
    byId.set(id, {
      title,
      company: rest[0] ?? "",
      location: rest[1] ?? null,
      url: cleanUrl(href),
      source: opts.source,
      salaryText: salary,
      experienceText: experience,
    });
  });

  return Array.from(byId.values()).filter((j) => j.company);
}

/**
 * Plain-text alerts list each job as a block of lines ending in its link:
 *   Senior React Developer
 *   Acme Tech
 *   Pune, Maharashtra, India
 *   View job: https://...
 */
export function parseTextAlert(
  text: string,
  opts: { source: JobSource; jobLink: RegExp },
): ParsedAlertJob[] {
  const out: ParsedAlertJob[] = [];
  const blocks = text.split(/\n\s*\n|-{3,}/);
  for (const block of blocks) {
    const url = block.match(/https?:\/\/\S+/g)?.find((u) => opts.jobLink.test(u));
    if (!url) continue;
    const ls = block
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/https?:\/\//.test(l) && !NOISE_LINE.test(l) && !SKIP_TEXT.test(l));
    if (ls.length < 2) continue;
    out.push({ title: ls[0], company: ls[1], location: ls[2] ?? null, url: cleanUrl(url.replace(/[>)\].,]+$/, "")), source: opts.source });
  }
  return out;
}

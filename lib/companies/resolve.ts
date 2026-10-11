import "server-only";
import * as cheerio from "cheerio";
import { detectAts, type AtsMatch } from "@/lib/ats/detect";
import { ATS_FETCHERS } from "@/lib/ats";
import { politeFetch } from "@/lib/http";
import { slugify } from "@/lib/utils";

export interface ResolvedCompany {
  name: string;
  domain: string | null;
  careersUrl: string | null;
  ats: AtsMatch | null;
  hrEmail: string | null;
  homepageHtml: string | null;
}

const CAREER_PATHS = ["/careers", "/jobs", "/join-us", "/work-with-us", "/careers/", "/company/careers", "/about/careers"];
const HR_EMAIL = /\b((?:careers?|jobs|hr|hiring|talent|recruit(?:ment|ing|er)?|people)[a-z0-9._-]*@[a-z0-9.-]+\.[a-z]{2,})\b/i;

export function parseCompanyInput(input: string): { name: string | null; domain: string | null } {
  const raw = input.trim();
  const looksLikeUrl = /^https?:\/\//i.test(raw) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(raw);
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      return { name: null, domain: url.hostname.replace(/^www\./, "").toLowerCase() };
    } catch {
      return { name: raw, domain: null };
    }
  }
  return { name: raw, domain: null };
}

export function nameFromDomain(domain: string): string {
  const base = domain.split(".")[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function findHrEmail(html: string): string | null {
  const $ = cheerio.load(html);
  let found: string | null = null;
  $('a[href^="mailto:"]').each((_, el) => {
    const addr = ($(el).attr("href") ?? "").replace(/^mailto:/i, "").split("?")[0];
    if (!found && HR_EMAIL.test(addr)) found = addr.toLowerCase();
  });
  if (found) return found;
  const m = $.root().text().match(HR_EMAIL);
  return m ? m[1].toLowerCase() : null;
}

/** Links on the homepage (often the footer) that point at a careers page. */
export function findCareerLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim().toLowerCase();
    if (/careers?|jobs|join (us|our team)|work with us|we.?re hiring|openings/.test(text) || /\/(careers?|jobs|join)/i.test(href)) {
      try {
        links.push(new URL(href, baseUrl).toString());
      } catch {
        // ignore malformed links
      }
    }
  });
  return Array.from(new Set(links)).slice(0, 5);
}

async function tryFetch(url: string) {
  try {
    const res = await politeFetch(url);
    return res.status < 400 ? res : null;
  } catch {
    return null;
  }
}

async function careerUrlsFromSitemap(origin: string): Promise<string[]> {
  const res = await tryFetch(`${origin}/sitemap.xml`);
  if (!res) return [];
  const urls = Array.from(res.body.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
  return urls.filter((u) => /\/(careers?|jobs|join-us|openings)(\/|$)/i.test(u)).slice(0, 3);
}

/** When only a name is given, try the job boards directly with the company slug. */
async function probeAtsBySlug(name: string): Promise<AtsMatch | null> {
  const slugs = Array.from(new Set([slugify(name).replace(/-/g, ""), slugify(name)])).filter(Boolean);
  for (const slug of slugs) {
    for (const type of ["greenhouse", "lever", "ashby"] as const) {
      try {
        const jobs = await ATS_FETCHERS[type](slug);
        if (jobs.length) return { type, token: slug };
      } catch {
        // not on this board
      }
    }
  }
  return null;
}

export async function resolveCompany(input: string): Promise<ResolvedCompany> {
  const parsed = parseCompanyInput(input);
  const directAts = detectAts(input);
  let domain = parsed.domain;
  const name = parsed.name ?? (domain ? nameFromDomain(domain) : input.trim());

  // Board URLs pasted directly (jobs.lever.co/acme) are not the company's own domain.
  if (directAts) {
    return { name, domain: null, careersUrl: input.trim(), ats: directAts, hrEmail: null, homepageHtml: null };
  }

  let homepage: Awaited<ReturnType<typeof tryFetch>> = null;
  if (!domain) {
    const slug = slugify(name).replace(/-/g, "");
    for (const tld of [".com", ".in", ".io", ".co", ".ai"]) {
      homepage = await tryFetch(`https://${slug}${tld}`);
      if (homepage) {
        domain = new URL(homepage.url).hostname.replace(/^www\./, "");
        break;
      }
    }
  } else {
    homepage = await tryFetch(`https://${domain}`);
  }

  if (!domain || !homepage) {
    const ats = await probeAtsBySlug(name);
    return { name, domain, careersUrl: null, ats, hrEmail: null, homepageHtml: homepage?.body ?? null };
  }

  const origin = new URL(homepage.url).origin;
  const ats = detectAts(homepage.body);
  if (ats) {
    return { name, domain, careersUrl: homepage.url, ats, hrEmail: findHrEmail(homepage.body), homepageHtml: homepage.body };
  }

  const candidates = [
    ...findCareerLinks(homepage.body, homepage.url),
    ...CAREER_PATHS.map((p) => `${origin}${p}`),
  ];
  let careersUrl: string | null = null;
  let careersHtml: string | null = null;
  for (const url of Array.from(new Set(candidates))) {
    const res = await tryFetch(url);
    if (res) {
      careersUrl = res.url;
      careersHtml = res.body;
      break;
    }
  }
  if (!careersUrl) {
    for (const url of await careerUrlsFromSitemap(origin)) {
      const res = await tryFetch(url);
      if (res) {
        careersUrl = res.url;
        careersHtml = res.body;
        break;
      }
    }
  }

  const careersAts = careersHtml ? detectAts(careersHtml) ?? detectAts(careersUrl ?? "") : null;
  return {
    name,
    domain,
    careersUrl,
    ats: careersAts ?? (careersUrl ? null : await probeAtsBySlug(name)),
    hrEmail: findHrEmail(careersHtml ?? "") ?? findHrEmail(homepage.body),
    homepageHtml: homepage.body,
  };
}

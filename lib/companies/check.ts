import "server-only";
import { ATS_BOARD_URL, ATS_FETCHERS, type AtsType, type RawPosting } from "@/lib/ats";
import { detectAts } from "@/lib/ats/detect";
import { llmPostingsSchema, looksClientRendered, pageTextForLlm, postingsFromHtml, postingsFromJsonLd } from "@/lib/ats/generic";
import { normalizePosting } from "@/lib/ats/types";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { FetchError, politeFetch } from "@/lib/http";
import { llmObject } from "@/lib/llm";
import { refreshVisibility, upsertJobs } from "@/lib/jobs/upsert";
import { htmlToText } from "@/lib/utils";
import { CLASSIFY_SYSTEM, acceptLlmClassification, classifyByRules, llmClassificationSchema, type Classification } from "./classifyType";
import { findHrEmail, resolveCompany } from "./resolve";

export type CheckOutcome = { status: "ok" | "manual" | "error"; found: number; created: number; message?: string };

async function readCareersPage(url: string): Promise<{ postings: RawPosting[]; manual: boolean; html: string }> {
  const page = await politeFetch(url);
  if (page.status >= 400) throw new FetchError("Could not reach this careers page", page.status);
  const ats = detectAts(page.body);
  if (ats) return { postings: await ATS_FETCHERS[ats.type](ats.token), manual: false, html: page.body };

  const fromLd = postingsFromJsonLd(page.body, page.url);
  if (fromLd.length) return { postings: fromLd, manual: false, html: page.body };

  const fromHtml = postingsFromHtml(page.body, page.url);
  if (fromHtml.length) return { postings: fromHtml, manual: false, html: page.body };

  if (looksClientRendered(page.body)) return { postings: [], manual: true, html: page.body };

  if (features.llm) {
    try {
      const result = await llmObject({
        schema: llmPostingsSchema,
        system: "Extract open job listings from a company careers page. Return only real openings, never navigation links.",
        prompt: pageTextForLlm(page.body),
      });
      const postings = result.jobs.map((j) => ({
        title: j.title,
        location: j.location,
        url: j.url ? new URL(j.url, page.url).toString() : page.url,
      }));
      if (postings.length) return { postings, manual: false, html: page.body };
    } catch {
      // fall through to manual
    }
  }
  return { postings: [], manual: true, html: page.body };
}

/** Run the full career-page check for one company and flag the results. */
export async function checkCompany(companyId: string): Promise<CheckOutcome> {
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  const now = new Date();
  let postings: RawPosting[] = [];
  let status: CheckOutcome["status"] = "ok";
  let message: string | undefined;

  try {
    if (company.atsType && company.atsType !== "custom" && company.atsToken) {
      postings = await ATS_FETCHERS[company.atsType as AtsType](company.atsToken);
    } else if (company.careersUrl) {
      const read = await readCareersPage(company.careersUrl);
      postings = read.postings;
      if (read.manual) status = "manual";
      if (!company.hrEmail) {
        const hrEmail = findHrEmail(read.html);
        if (hrEmail) await db.company.update({ where: { id: company.id }, data: { hrEmail } });
      }
    } else {
      status = "manual";
      message = "No careers page found";
    }
  } catch (err) {
    status = "error";
    message = err instanceof FetchError ? err.message : "Could not reach this careers page. Check the web address or try again later.";
  }

  let created: string[] = [];
  let ids: string[] = [];
  if (status === "ok") {
    const normalized = postings.map((p) => normalizePosting(p, { name: company.name, domain: company.domain }));
    ({ ids, created } = await upsertJobs(normalized, company.id));
    // Career-page roles that disappeared are closed.
    await db.job.updateMany({
      where: { companyId: company.id, source: "career_page", closedAt: null, id: { notIn: ids } },
      data: { closedAt: now },
    });
  }

  await db.company.update({
    where: { id: company.id },
    data: { checkStatus: status, checkError: message ?? null, lastChecked: status === "error" ? company.lastChecked : now },
  });
  await refreshVisibility(company.id);
  return { status, found: ids.length, created: created.length, message };
}

/** Resolve a name or website into a Company row, detecting its careers page and job board. */
export async function addCompany(input: string) {
  const resolved = await resolveCompany(input);
  const existing = resolved.domain
    ? await db.company.findUnique({ where: { domain: resolved.domain } })
    : resolved.ats
      ? await db.company.findFirst({ where: { atsType: resolved.ats.type, atsToken: resolved.ats.token } })
      : await db.company.findFirst({ where: { name: { equals: resolved.name, mode: "insensitive" } } });

  const data = {
    careersUrl: resolved.careersUrl ?? (resolved.ats ? ATS_BOARD_URL[resolved.ats.type](resolved.ats.token) : null),
    atsType: resolved.ats?.type ?? (resolved.careersUrl ? "custom" : null),
    atsToken: resolved.ats?.token ?? null,
    hrEmail: resolved.hrEmail,
  };
  const company = existing
    ? await db.company.update({
        where: { id: existing.id },
        data: {
          careersUrl: existing.careersUrl ?? data.careersUrl,
          atsType: existing.atsType ?? data.atsType,
          atsToken: existing.atsToken ?? data.atsToken,
          hrEmail: existing.hrEmail ?? data.hrEmail,
        },
      })
    : await db.company.create({ data: { name: resolved.name, domain: resolved.domain, ...data } });

  return { company, homepageHtml: resolved.homepageHtml };
}

async function aboutText(domain: string, homepageHtml?: string | null): Promise<string> {
  const parts: string[] = [];
  if (homepageHtml) parts.push(htmlToText(homepageHtml));
  else {
    try {
      parts.push(htmlToText((await politeFetch(`https://${domain}`)).body));
    } catch {
      // ignore
    }
  }
  for (const path of ["/about", "/about-us", "/company"]) {
    try {
      const res = await politeFetch(`https://${domain}${path}`);
      if (res.status < 400) {
        parts.push(htmlToText(res.body));
        break;
      }
    } catch {
      // ignore
    }
  }
  return parts.join("\n\n").slice(0, 20_000);
}

/** Step 6: rules, then LLM at confidence >= 0.7, otherwise unknown. */
export async function classifyCompany(companyId: string, homepageHtml?: string | null): Promise<Classification> {
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
  if (company.companyTypeSource === "reviewed") {
    return { type: company.companyType as Classification["type"], source: null, reason: company.companyTypeReason, industry: company.industry };
  }
  const text = company.domain ? await aboutText(company.domain, homepageHtml) : "";
  let result: Classification = text ? classifyByRules(text) : { type: "unknown", source: null, reason: null, industry: null };

  if (result.type === "unknown" && text && features.llm) {
    try {
      const llm = await llmObject({
        schema: llmClassificationSchema,
        system: CLASSIFY_SYSTEM,
        prompt: `Company: ${company.name}\nWebsite: ${company.domain}\n\n${text.slice(0, 8000)}`,
      });
      result = { ...acceptLlmClassification(llm), industry: llm.industry ?? result.industry };
    } catch {
      // keep unknown
    }
  }

  await db.company.update({
    where: { id: company.id },
    data: {
      companyType: result.type,
      companyTypeSource: result.source,
      companyTypeReason: result.reason,
      industry: result.industry ?? company.industry,
      typeCheckedAt: new Date(),
    },
  });
  return result;
}

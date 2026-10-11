import { parseHtmlAlert, parseTextAlert, type ParsedAlertJob } from "./common";

const JOB_LINK = /glassdoor\.[a-z.]+\/(job-listing\/|partner\/joblisting\.htm|Job\/.*jl=|.*[?&]jl=)/i;

export function isGlassdoorAlert(from: string, subject: string): boolean {
  return /glassdoor/i.test(from) && /job|opening|hiring/i.test(subject);
}

function glassdoorId(u: string): string | null {
  return u.match(/[?&](?:jl|jobListingId)=(\d+)/i)?.[1] ?? u.match(/JV_[A-Z0-9_]*?(\d{6,})/i)?.[1] ?? u.match(/job-listing\/[^?]*?(\d{6,})/i)?.[1] ?? null;
}

export function parseGlassdoorAlert(html: string | null, text: string | null): ParsedAlertJob[] {
  const fromHtml = html ? parseHtmlAlert(html, { source: "glassdoor", jobLink: JOB_LINK, idFromUrl: glassdoorId }) : [];
  if (fromHtml.length) return fromHtml;
  return text ? parseTextAlert(text, { source: "glassdoor", jobLink: JOB_LINK }) : [];
}

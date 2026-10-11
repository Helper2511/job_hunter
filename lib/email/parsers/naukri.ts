import { parseHtmlAlert, parseTextAlert, type ParsedAlertJob } from "./common";

const JOB_LINK = /naukri\.com\/(job-listings-|.*jobid=|.*[?&]jdid=)/i;

export function isNaukriAlert(from: string, subject: string): boolean {
  return /naukri/i.test(from) && /job|opening|vacanc|recommended/i.test(subject);
}

function naukriId(u: string): string | null {
  return u.match(/job-listings-[a-z0-9-]*?-(\d{6,})/i)?.[1] ?? u.match(/(?:jobid|jdid)=([a-z0-9]+)/i)?.[1] ?? null;
}

export function parseNaukriAlert(html: string | null, text: string | null): ParsedAlertJob[] {
  const fromHtml = html ? parseHtmlAlert(html, { source: "naukri", jobLink: JOB_LINK, idFromUrl: naukriId }) : [];
  if (fromHtml.length) return fromHtml;
  return text ? parseTextAlert(text, { source: "naukri", jobLink: JOB_LINK }) : [];
}

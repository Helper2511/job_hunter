import { parseHtmlAlert, parseTextAlert, type ParsedAlertJob } from "./common";

const JOB_LINK = /linkedin\.com\/(comm\/)?jobs\/view\/\d+/i;

export function isLinkedInAlert(from: string, subject: string): boolean {
  if (/(jobalerts|jobs-listings|jobs-noreply)[^@]*@linkedin\.com/i.test(from)) return true;
  return /linkedin\.com/i.test(from) && /job|hiring|role|and more/i.test(subject);
}

export function parseLinkedInAlert(html: string | null, text: string | null): ParsedAlertJob[] {
  const idFromUrl = (u: string) => u.match(/jobs\/view\/(\d+)/)?.[1] ?? null;
  const fromHtml = html ? parseHtmlAlert(html, { source: "linkedin", jobLink: JOB_LINK, idFromUrl }) : [];
  const jobs = fromHtml.length ? fromHtml : text ? parseTextAlert(text, { source: "linkedin", jobLink: JOB_LINK }) : [];
  return jobs.map((j) => {
    const id = idFromUrl(j.url);
    return { ...j, url: id ? `https://www.linkedin.com/jobs/view/${id}/` : j.url };
  });
}

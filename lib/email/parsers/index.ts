import type { ParsedAlertJob } from "./common";
import { isGlassdoorAlert, parseGlassdoorAlert } from "./glassdoor";
import { isLinkedInAlert, parseLinkedInAlert } from "./linkedin";
import { isNaukriAlert, parseNaukriAlert } from "./naukri";

export type { ParsedAlertJob };

export type AlertKind = "alert" | "forwarding_confirmation" | "other";

/** Forwarded mail keeps the original sender in the body; look there too. */
function originalSender(from: string, text: string | null, html: string | null): string {
  const body = `${text ?? ""}\n${html ?? ""}`;
  const fwd = body.match(/From:\s*(?:"?[^"<\n]*"?\s*)?<?([a-z0-9._%+-]+@[a-z0-9.-]+)>?/i);
  return fwd ? `${from} ${fwd[1]}` : from;
}

export function classifyInbound(from: string, subject: string, text: string | null, html: string | null): {
  kind: AlertKind;
  source: "linkedin" | "naukri" | "glassdoor" | null;
} {
  if (/forwarding.?confirmation|confirm.*forward|forwarding-noreply@google\.com|verify.*forward/i.test(`${from} ${subject}`)) {
    return { kind: "forwarding_confirmation", source: null };
  }
  const sender = originalSender(from, text, html);
  const subj = subject.replace(/^(fwd?|fw):\s*/i, "");
  if (isLinkedInAlert(sender, subj)) return { kind: "alert", source: "linkedin" };
  if (isNaukriAlert(sender, subj)) return { kind: "alert", source: "naukri" };
  if (isGlassdoorAlert(sender, subj)) return { kind: "alert", source: "glassdoor" };
  // Fall back to the links in the body.
  const body = html ?? text ?? "";
  if (/linkedin\.com\/(comm\/)?jobs\/view/i.test(body)) return { kind: "alert", source: "linkedin" };
  if (/naukri\.com\/job-listings/i.test(body)) return { kind: "alert", source: "naukri" };
  if (/glassdoor\.[a-z.]+\/(job-listing|partner\/joblisting)/i.test(body)) return { kind: "alert", source: "glassdoor" };
  return { kind: "other", source: null };
}

export function parseAlert(source: "linkedin" | "naukri" | "glassdoor", html: string | null, text: string | null): ParsedAlertJob[] {
  if (source === "linkedin") return parseLinkedInAlert(html, text);
  if (source === "naukri") return parseNaukriAlert(html, text);
  return parseGlassdoorAlert(html, text);
}

/** Pull the verification link or code out of a forwarding confirmation email. */
export function extractForwardingConfirmation(text: string | null, html: string | null): { link: string | null; code: string | null } {
  const body = `${text ?? ""}\n${html ?? ""}`;
  const link = body.match(/https:\/\/mail(?:-settings)?\.google\.com\/mail\/[^\s"'<>]+/i)?.[0] ?? body.match(/https?:\/\/[^\s"'<>]*(?:confirm|verify)[^\s"'<>]*/i)?.[0] ?? null;
  const code = body.match(/confirmation code:\s*(\d{6,12})/i)?.[1] ?? body.match(/\b(\d{9})\b/)?.[1] ?? null;
  return { link: link?.replace(/&amp;/g, "&") ?? null, code };
}

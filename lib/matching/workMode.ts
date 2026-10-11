import type { RemoteScope, WorkMode } from "@/lib/providers/types";

export interface WorkModeInput {
  atsMode?: string | null; // a work-mode field from the job board, if it has one
  jsonLdLocationType?: string | null; // JobPosting.jobLocationType
  title?: string | null;
  location?: string | null;
  description?: string | null;
}

export function fromAtsValue(value: string | null | undefined): WorkMode | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/[^a-z]/g, "");
  if (v === "remote" || v === "fullyremote" || v === "telecommute") return "remote";
  if (v === "hybrid") return "hybrid";
  if (v === "onsite" || v === "inoffice" || v === "office") return "onsite";
  return null;
}

/**
 * Detect the work mode in the order the spec sets: job-board field, JSON-LD,
 * keywords in title / location / description, otherwise unknown.
 */
export function detectWorkMode(input: WorkModeInput): WorkMode | "unknown" {
  const fromAts = fromAtsValue(input.atsMode);
  if (fromAts) return fromAts;

  if (input.jsonLdLocationType && /telecommute/i.test(input.jsonLdLocationType)) return "remote";

  const head = `${input.title ?? ""} ${input.location ?? ""}`.toLowerCase();
  if (/\bhybrid\b/.test(head)) return "hybrid";
  if (/\b(remote|work from home|wfh|work-from-home)\b/.test(head)) return "remote";
  if (/\b(on-?site|in-office|work from office|wfo)\b/.test(head)) return "onsite";

  const body = (input.description ?? "").toLowerCase().slice(0, 6000);
  if (/\bhybrid\b|\b\d\s*days?\s*(a week\s*)?(in|from)\s*(the\s*)?office\b|days in office/.test(body)) return "hybrid";
  if (/\b(fully remote|100% remote|remote-first|remote first|work from home|work from anywhere|this is a remote)\b/.test(body)) {
    return "remote";
  }
  if (/\b(work from office|on-?site role|onsite role|5 days (a week )?(in|from) (the )?office)\b/.test(body)) return "onsite";
  return "unknown";
}

/** Remote roles are often limited to one country. */
export function detectRemoteScope(text: string | null | undefined, country?: string | null): RemoteScope | null {
  const t = (text ?? "").toLowerCase();
  if (/\b(worldwide|anywhere in the world|global(ly)?|any timezone|work from anywhere)\b/.test(t)) return "worldwide";
  if (/\bindia\b/.test(t) || country === "India") return "india";
  return null;
}

import type { CompanyType, JobSource, WorkMode } from "@/lib/providers/types";

export const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const WORK_MODE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Not specified",
};

export const COMPANY_TYPES: { value: CompanyType; label: string; hint: string }[] = [
  { value: "saas", label: "SaaS", hint: "Sells its own software as a subscription" },
  { value: "product", label: "Product", hint: "Builds and sells its own product" },
  { value: "services", label: "Services", hint: "Builds or runs things for clients" },
  { value: "manufacturing", label: "Manufacturing", hint: "Makes physical goods in its own plants" },
  { value: "other", label: "Other", hint: "Banks, hospitals, education, retail and more" },
];

export const COMPANY_TYPE_LABEL: Record<string, string> = {
  saas: "SaaS",
  product: "Product",
  services: "Services",
  manufacturing: "Manufacturing",
  other: "Other",
  unknown: "Not classified",
};

export const SOURCES: { value: JobSource; label: string; short: string }[] = [
  { value: "linkedin", label: "LinkedIn", short: "in" },
  { value: "naukri", label: "Naukri", short: "nk" },
  { value: "glassdoor", label: "Glassdoor", short: "gd" },
  { value: "career_page", label: "Career page", short: "cp" },
  { value: "manual", label: "Added by you", short: "me" },
  { value: "aggregator", label: "Jobs data feed", short: "fd" },
];

export const SOURCE_LABEL: Record<string, { label: string; short: string }> = Object.fromEntries(
  SOURCES.map((s) => [s.value, { label: s.label, short: s.short }]),
);

export const PLATFORM_SOURCES: JobSource[] = ["linkedin", "naukri", "glassdoor", "aggregator"];

export const POSTED_WITHIN: { value: number; label: string }[] = [
  { value: 1, label: "24 hours" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
];

export const APPLICATION_STATUSES = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const VISIBILITY = {
  CAREER_PAGE_ONLY: "CAREER_PAGE_ONLY",
  BOTH: "BOTH",
  PLATFORM_ONLY: "PLATFORM_ONLY",
  UNCHECKED: "UNCHECKED",
} as const;

export const MAX_DAILY_EMAILS = 20;
export const MAX_DAILY_LLM_CALLS = 60;
export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
export const BOT_USER_AGENT = "JobHuntHubBot/1.0 (+https://github.com/Helper2511/job_hunter)";

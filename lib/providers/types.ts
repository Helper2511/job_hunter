export type WorkMode = "onsite" | "hybrid" | "remote";
export type CompanyType = "saas" | "product" | "services" | "manufacturing" | "other";
export type JobSource = "linkedin" | "naukri" | "glassdoor" | "career_page" | "manual" | "aggregator";
export type RemoteScope = "india" | "worldwide";

export interface JobQuery {
  keywords: string;
  workModes?: WorkMode[]; // multi-select; empty = all
  locations?: string[]; // ["Pune", "Bengaluru"]; applies to hybrid and on-site
  radiusKm?: number;
  remoteScope?: RemoteScope;
  experienceYears?: [number, number];
  postedWithinDays?: number;
  companyTypes?: CompanyType[]; // multi-select; empty = all
  careerPageOnly?: boolean;
  sources?: JobSource[];
  salaryMin?: number;
  hideUnknownWorkMode?: boolean;
  hideUnclassified?: boolean;
}

/** A job as returned by any provider, before it is stored. */
export interface NormalizedJob {
  title: string;
  company: string;
  companyDomain?: string | null;
  location?: string | null;
  cities: string[];
  country?: string | null;
  workMode: WorkMode | "unknown";
  remoteScope?: RemoteScope | null;
  url: string;
  applyUrl?: string | null;
  source: JobSource;
  description?: string | null;
  postedAt?: Date | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  salaryText?: string | null;
  salaryMin?: number | null;
}

export interface JobProvider {
  id: string; // "email-alerts" | "career-page" | "manual" | ...
  search(q: JobQuery): Promise<NormalizedJob[]>;
}

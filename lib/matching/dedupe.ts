import { createHash } from "node:crypto";
import { normalizeCompanyName, normalizeLocationKey, normalizeTitle } from "./normalize";

export function dedupeKey(company: string, title: string, cities: string[], workMode: string): string {
  const raw = [normalizeCompanyName(company), normalizeTitle(title), normalizeLocationKey(cities, workMode)].join("::");
  return createHash("sha1").update(raw).digest("hex");
}

/** Collapse rows that share a dedupe key, keeping every source they were seen on. */
export function groupByDedupeKey<T extends { dedupeKey: string; source: string }>(rows: T[]): (T & { sources: string[] })[] {
  const groups = new Map<string, T & { sources: string[] }>();
  for (const row of rows) {
    const existing = groups.get(row.dedupeKey);
    if (existing) {
      if (!existing.sources.includes(row.source)) existing.sources.push(row.source);
      // Prefer the career-page row as the canonical one: it links to the company itself.
      if (row.source === "career_page" && existing.source !== "career_page") {
        groups.set(row.dedupeKey, { ...row, sources: existing.sources });
      }
    } else {
      groups.set(row.dedupeKey, { ...row, sources: [row.source] });
    }
  }
  return Array.from(groups.values());
}

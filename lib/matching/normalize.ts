/** Words that change seniority or form but not the role itself. */
const NOISE = new Set([
  "senior", "sr", "junior", "jr", "lead", "principal", "staff", "associate", "head", "chief",
  "i", "ii", "iii", "iv", "1", "2", "3", "4", "l1", "l2", "l3", "l4", "sde1", "sde2",
  "intern", "trainee", "fresher", "experienced", "mid", "level", "entry",
  "remote", "hybrid", "onsite", "on", "site", "wfh", "urgent", "hiring", "immediate", "joiner", "joiners",
  "fulltime", "full", "time", "contract", "permanent", "m", "f", "d", "x", "w",
]);

const SYNONYMS: Record<string, string> = {
  engg: "engineer",
  eng: "engineer",
  engineering: "engineer",
  developer: "engineer",
  dev: "engineer",
  programmer: "engineer",
  swe: "software engineer",
  sde: "software engineer",
  fe: "frontend",
  "front-end": "frontend",
  front: "frontend",
  be: "backend",
  "back-end": "backend",
  back: "backend",
  fullstack: "full stack",
  "full-stack": "full stack",
  reactjs: "react",
  "react.js": "react",
  nodejs: "node",
  "node.js": "node",
  js: "javascript",
  ts: "typescript",
  mgr: "manager",
  pm: "product manager",
  qa: "quality assurance",
  ml: "machine learning",
  ai: "artificial intelligence",
};

export function normalizeTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\s[-–|@]\s.*$/, " ") // "Engineer - Payments | Bangalore" -> "Engineer"
    .replace(/[^a-z0-9.+#\- ]+/g, " ");
  const tokens = base
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter(Boolean)
    .flatMap((t) => (SYNONYMS[t] ?? t).split(" "))
    .filter((t) => !NOISE.has(t));
  return tokens.join(" ").trim();
}

export function normalizeLocationKey(cities: string[], workMode: string): string {
  if (workMode === "remote" && cities.length === 0) return "remote";
  return [...cities].map((c) => c.toLowerCase()).sort().join("|");
}

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|inc|llc|llp|corp|corporation|co|technologies|technology|tech|solutions|software|labs|india|global|group)\b\.?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(s.split(" ").filter(Boolean));
}

/** Jaccard similarity over normalised title tokens, 0..1. */
export function titleSimilarity(a: string, b: string): number {
  const ta = tokens(normalizeTitle(a));
  const tb = tokens(normalizeTitle(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

export function titlesMatch(a: string, b: string, threshold = 0.6): boolean {
  if (normalizeTitle(a) === normalizeTitle(b)) return true;
  return titleSimilarity(a, b) >= threshold;
}

export function locationsOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return true;
  const set = new Set(a.map((c) => c.toLowerCase()));
  return b.some((c) => set.has(c.toLowerCase()));
}

/** Parse "3-5 years", "2+ yrs", "0 - 2 Yrs" into a range. */
export function parseExperience(text: string | null | undefined): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null };
  const range = text.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const plus = text.match(/(\d{1,2})\s*\+\s*(?:years?|yrs?)/i) ?? text.match(/(?:minimum|min\.?|at least)\s*(\d{1,2})\s*(?:years?|yrs?)/i);
  if (plus) return { min: Number(plus[1]), max: null };
  return { min: null, max: null };
}

/** Parse "12-18 LPA", "₹ 10,00,000 - 15,00,000 a year" into a minimum annual amount in rupees. */
export function parseSalary(text: string | null | undefined): number | null {
  if (!text) return null;
  const lpa = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(?:\d+(?:\.\d+)?)?\s*(?:lpa|lakhs?|lacs?)/i);
  if (lpa) return Math.round(Number(lpa[1]) * 100_000);
  const rupees = text.match(/₹\s*([\d,]+)/);
  if (rupees) {
    const n = Number(rupees[1].replace(/,/g, ""));
    return Number.isFinite(n) && n > 10_000 ? n : null;
  }
  return null;
}

export function formatSalary(text: string | null | undefined): string | null {
  if (!text) return null;
  const lpa = text.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lacs?)/i);
  if (lpa) return `${lpa[1]} to ${lpa[2]} LPA`;
  return text.trim();
}

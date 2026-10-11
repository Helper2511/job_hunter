import { describe, expect, it } from "vitest";
import { buildJobWhere, jobMatchesQuery, type FilterableJob } from "@/lib/matching/filters";
import { activeFilterCount, queryFromParams, queryToParams } from "@/lib/matching/query";
import type { JobQuery } from "@/lib/providers/types";

const now = new Date("2026-10-11T10:00:00Z");

function job(p: Partial<FilterableJob>): FilterableJob {
  return {
    title: "React Developer",
    companyName: "Acme",
    companyType: "saas",
    workMode: "onsite",
    cities: ["Pune"],
    country: "India",
    source: "career_page",
    visibility: "BOTH",
    firstSeenAt: new Date("2026-10-10T10:00:00Z"),
    ...p,
  };
}

const remoteIndia = job({ workMode: "remote", cities: [], remoteScope: "india" });
const remoteUs = job({ workMode: "remote", cities: [], country: "United States", remoteScope: null });
const hybridPune = job({ workMode: "hybrid", cities: ["Pune"] });
const hybridMumbai = job({ workMode: "hybrid", cities: ["Mumbai"] });
const onsitePune = job({ workMode: "onsite", cities: ["Pune"] });
const onsiteChennai = job({ workMode: "onsite", cities: ["Chennai"] });
const unknownPune = job({ workMode: "unknown", cities: ["Pune"] });

describe("work mode and location rules", () => {
  const q: JobQuery = { keywords: "", workModes: ["remote", "hybrid"], locations: ["Pune"] };

  it('"Remote + Hybrid, Pune" returns remote roles plus hybrid roles in Pune', () => {
    expect(jobMatchesQuery(remoteIndia, q, now)).toBe(true);
    expect(jobMatchesQuery(hybridPune, q, now)).toBe(true);
  });

  it("excludes hybrid roles in other cities and every on-site role", () => {
    expect(jobMatchesQuery(hybridMumbai, q, now)).toBe(false);
    expect(jobMatchesQuery(onsitePune, q, now)).toBe(false);
    expect(jobMatchesQuery(onsiteChennai, q, now)).toBe(false);
  });

  it("includes jobs with no stated mode unless hidden", () => {
    expect(jobMatchesQuery(unknownPune, q, now)).toBe(true);
    expect(jobMatchesQuery(unknownPune, { ...q, hideUnknownWorkMode: true }, now)).toBe(false);
  });

  it("limits remote roles by scope", () => {
    expect(jobMatchesQuery(remoteUs, { ...q, remoteScope: "india" }, now)).toBe(false);
    expect(jobMatchesQuery(remoteIndia, { ...q, remoteScope: "india" }, now)).toBe(true);
    expect(jobMatchesQuery(remoteIndia, { ...q, remoteScope: "worldwide" }, now)).toBe(false);
  });

  it("covers regions and anywhere in India", () => {
    const noida = job({ workMode: "onsite", cities: ["Noida"] });
    expect(jobMatchesQuery(noida, { keywords: "", locations: ["Delhi NCR"] }, now)).toBe(true);
    expect(jobMatchesQuery(onsiteChennai, { keywords: "", locations: ["Anywhere in India"] }, now)).toBe(true);
  });
});

describe("company type", () => {
  it('"SaaS" keeps only SaaS companies, plus unclassified unless hidden', () => {
    const q: JobQuery = { keywords: "", companyTypes: ["saas"] };
    expect(jobMatchesQuery(job({ companyType: "saas" }), q, now)).toBe(true);
    expect(jobMatchesQuery(job({ companyType: "services" }), q, now)).toBe(false);
    expect(jobMatchesQuery(job({ companyType: "unknown" }), q, now)).toBe(true);
    expect(jobMatchesQuery(job({ companyType: "unknown" }), { ...q, hideUnclassified: true }, now)).toBe(false);
  });
});

describe("other filters", () => {
  it("matches every keyword", () => {
    expect(jobMatchesQuery(job({}), { keywords: "react acme" }, now)).toBe(true);
    expect(jobMatchesQuery(job({}), { keywords: "react vue" }, now)).toBe(false);
  });
  it("filters by date posted", () => {
    const old = job({ firstSeenAt: new Date("2026-09-01T00:00:00Z") });
    expect(jobMatchesQuery(old, { keywords: "", postedWithinDays: 7 }, now)).toBe(false);
  });
  it("shows only career-page-only roles when asked", () => {
    expect(jobMatchesQuery(job({ visibility: "CAREER_PAGE_ONLY" }), { keywords: "", careerPageOnly: true }, now)).toBe(true);
    expect(jobMatchesQuery(job({}), { keywords: "", careerPageOnly: true }, now)).toBe(false);
  });
  it("filters by experience overlap", () => {
    const senior = job({ experienceMin: 8, experienceMax: 12 });
    expect(jobMatchesQuery(senior, { keywords: "", experienceYears: [0, 3] }, now)).toBe(false);
    expect(jobMatchesQuery(senior, { keywords: "", experienceYears: [5, 10] }, now)).toBe(true);
  });
});

describe("prisma where builder", () => {
  it("puts hybrid and on-site behind the city filter and leaves remote open", () => {
    const where = buildJobWhere({ keywords: "", workModes: ["remote", "hybrid"], locations: ["Pune"] }, { now });
    const modes = (where.AND as object[])[1] as { OR: Record<string, unknown>[] };
    expect(modes.OR[0]).toEqual({ workMode: "remote" });
    expect(modes.OR[1]).toMatchObject({ workMode: { in: ["hybrid"] }, OR: [{ cities: { hasSome: ["Pune"] } }] });
  });

  it("applies a user's own type corrections", () => {
    const where = buildJobWhere({ keywords: "", companyTypes: ["saas"] }, { corrections: { c1: "saas", c2: "services" } });
    const typeClause = (where.AND as object[]).find((c) => JSON.stringify(c).includes("companyType")) as { OR: object[] };
    expect(typeClause.OR).toContainEqual({ companyId: { in: ["c1"] } });
    expect(JSON.stringify(typeClause.OR[0])).toContain('"notIn":["c1","c2"]');
  });

  it("excludes jobs the user hid", () => {
    const where = buildJobWhere({ keywords: "" }, { userId: "u1" });
    expect(where.AND).toContainEqual({ hiddenBy: { none: { userId: "u1" } } });
  });
});

describe("URL params", () => {
  it("round-trips a query", () => {
    const q: JobQuery = {
      keywords: "react developer",
      workModes: ["remote", "hybrid"],
      locations: ["Pune", "Bengaluru"],
      companyTypes: ["saas", "product"],
      careerPageOnly: true,
      postedWithinDays: 7,
    };
    const back = queryFromParams(queryToParams(q));
    expect(back).toMatchObject(q);
    expect(activeFilterCount(back)).toBe(5);
  });

  it("drops unknown values", () => {
    const q = queryFromParams(new URLSearchParams("modes=remote,space&types=saas,bogus"));
    expect(q.workModes).toEqual(["remote"]);
    expect(q.companyTypes).toEqual(["saas"]);
  });
});

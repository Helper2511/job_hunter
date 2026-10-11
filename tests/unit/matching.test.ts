import { describe, expect, it } from "vitest";
import { citiesWithin, expandLocation, normalizeCity, parseLocation, searchCities } from "@/lib/matching/cities";
import { dedupeKey, groupByDedupeKey } from "@/lib/matching/dedupe";
import { normalizeTitle, parseExperience, parseSalary, formatSalary, titlesMatch } from "@/lib/matching/normalize";
import { detectRemoteScope, detectWorkMode } from "@/lib/matching/workMode";

describe("cities", () => {
  it("maps old names and spellings to one city", () => {
    expect(normalizeCity("Bangalore")).toBe("Bengaluru");
    expect(normalizeCity("gurgaon")).toBe("Gurugram");
    expect(normalizeCity("Bombay")).toBe("Mumbai");
    expect(normalizeCity("Atlantis")).toBeNull();
  });

  it("expands Delhi NCR into its cities", () => {
    expect(expandLocation("Delhi NCR")).toEqual(["Delhi", "Noida", "Gurugram", "Ghaziabad", "Faridabad"]);
  });

  it("parses listing locations with several cities", () => {
    const loc = parseLocation("Bangalore / Pune, India");
    expect(loc.cities).toEqual(["Bengaluru", "Pune"]);
    expect(loc.country).toBe("India");
  });

  it("detects remote and hybrid words in locations", () => {
    expect(parseLocation("Remote - India").mentionsRemote).toBe(true);
    expect(parseLocation("Hybrid - Gurgaon").cities).toEqual(["Gurugram"]);
  });

  it("finds Bengaluru when typing Bangalore", () => {
    expect(searchCities("Bangalore")).toContain("Bengaluru");
  });

  it("finds cities within a radius", () => {
    const near = citiesWithin("Delhi", 30);
    expect(near).toEqual(expect.arrayContaining(["Delhi", "Noida", "Gurugram"]));
    expect(near).not.toContain("Pune");
  });
});

describe("normalize", () => {
  it("strips seniority noise and unifies synonyms", () => {
    expect(normalizeTitle("Senior React.js Developer (Remote)")).toBe("react engineer");
    expect(normalizeTitle("Sr. Frontend Engineer - Payments")).toBe("frontend engineer");
  });

  it("matches the same role written differently", () => {
    expect(titlesMatch("Senior React Developer", "React Engineer")).toBe(true);
    expect(titlesMatch("Backend Engineer", "Product Designer")).toBe(false);
  });

  it("parses experience ranges", () => {
    expect(parseExperience("3-5 years of experience")).toEqual({ min: 3, max: 5 });
    expect(parseExperience("2+ yrs")).toEqual({ min: 2, max: null });
    expect(parseExperience("nothing here")).toEqual({ min: null, max: null });
  });

  it("parses and formats lakhs per annum", () => {
    expect(parseSalary("12-18 LPA")).toBe(1_200_000);
    expect(formatSalary("12-18 LPA")).toBe("12 to 18 LPA");
  });
});

describe("work mode", () => {
  it("prefers the job board field", () => {
    expect(detectWorkMode({ atsMode: "on-site", title: "Remote Engineer" })).toBe("onsite");
  });
  it("reads JSON-LD TELECOMMUTE", () => {
    expect(detectWorkMode({ jsonLdLocationType: "TELECOMMUTE" })).toBe("remote");
  });
  it("falls back to keywords", () => {
    expect(detectWorkMode({ title: "Engineer", location: "Pune (Hybrid)" })).toBe("hybrid");
    expect(detectWorkMode({ title: "Engineer", description: "You will spend 3 days in office each week." })).toBe("hybrid");
    expect(detectWorkMode({ title: "Engineer", location: "Work from home" })).toBe("remote");
    expect(detectWorkMode({ title: "Engineer" })).toBe("unknown");
  });
  it("detects remote scope", () => {
    expect(detectRemoteScope("Remote - India")).toBe("india");
    expect(detectRemoteScope("Remote, worldwide")).toBe("worldwide");
  });
});

describe("dedupe", () => {
  it("gives the same key to the same role across sources", () => {
    const a = dedupeKey("Acme Technologies Pvt Ltd", "Senior React Developer", ["Pune"], "hybrid");
    const b = dedupeKey("Acme", "React Engineer", ["Pune"], "hybrid");
    expect(a).toBe(b);
  });

  it("groups rows and keeps every source, preferring the career-page row", () => {
    const grouped = groupByDedupeKey([
      { id: "1", dedupeKey: "k", source: "linkedin" },
      { id: "2", dedupeKey: "k", source: "career_page" },
      { id: "3", dedupeKey: "z", source: "naukri" },
    ]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]).toMatchObject({ id: "2", sources: ["linkedin", "career_page"] });
  });
});

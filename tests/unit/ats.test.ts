import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { mapAshby } from "@/lib/ats/ashby";
import { detectAts } from "@/lib/ats/detect";
import { looksClientRendered, postingsFromHtml, postingsFromJsonLd } from "@/lib/ats/generic";
import { mapGreenhouse } from "@/lib/ats/greenhouse";
import { mapLever } from "@/lib/ats/lever";
import { mapRecruitee } from "@/lib/ats/recruitee";
import { mapSmartRecruiters } from "@/lib/ats/smartrecruiters";
import { normalizePosting } from "@/lib/ats/types";
import { mapWorkable } from "@/lib/ats/workable";

describe("detecting the job board", () => {
  it.each([
    ["https://boards.greenhouse.io/acme", "greenhouse", "acme"],
    ["https://job-boards.greenhouse.io/acme/jobs/123", "greenhouse", "acme"],
    ['<script src="https://boards.greenhouse.io/embed/job_board/js?for=acme"></script>', "greenhouse", "acme"],
    ["https://jobs.lever.co/brightlabs/abc-123", "lever", "brightlabs"],
    ["https://jobs.ashbyhq.com/northwind", "ashby", "northwind"],
    ["https://careers.smartrecruiters.com/Globex1", "smartrecruiters", "Globex1"],
    ["https://initech.recruitee.com/o/frontend", "recruitee", "initech"],
    ["https://apply.workable.com/umbrella/j/ABC123/", "workable", "umbrella"],
  ])("%s", (input, type, token) => {
    expect(detectAts(input)).toEqual({ type, token });
  });

  it("returns null for unknown pages", () => {
    expect(detectAts("https://acme.com/careers")).toBeNull();
  });
});

describe("board adapters", () => {
  it("Greenhouse", () => {
    const [p] = mapGreenhouse({
      jobs: [{ id: 1, title: "Backend Engineer", absolute_url: "https://boards.greenhouse.io/acme/jobs/1", location: { name: "Bengaluru, India" }, first_published: "2026-10-01T00:00:00Z", content: "&lt;p&gt;Build APIs&lt;/p&gt;" }],
    });
    expect(p).toMatchObject({ title: "Backend Engineer", location: "Bengaluru, India", description: "Build APIs" });
  });

  it("Lever uses its workplace type", () => {
    const [p] = mapLever([
      { id: "a", text: "Frontend Engineer", hostedUrl: "https://jobs.lever.co/x/a", applyUrl: "https://jobs.lever.co/x/a/apply", workplaceType: "hybrid", createdAt: 1_760_000_000_000, categories: { location: "Pune" }, descriptionPlain: "React" },
    ]);
    expect(normalizePosting(p, { name: "X" })).toMatchObject({ workMode: "hybrid", cities: ["Pune"], applyUrl: "https://jobs.lever.co/x/a/apply" });
  });

  it("Ashby includes secondary locations and skips unlisted roles", () => {
    const out = mapAshby({
      jobs: [
        { title: "SRE", location: "Bengaluru", secondaryLocations: [{ location: "Hyderabad" }], workplaceType: "OnSite", jobUrl: "https://jobs.ashbyhq.com/n/1" },
        { title: "Hidden", jobUrl: "https://jobs.ashbyhq.com/n/2", isListed: false },
      ],
    });
    expect(out).toHaveLength(1);
    expect(normalizePosting(out[0], { name: "N" })).toMatchObject({ cities: ["Bengaluru", "Hyderabad"], workMode: "onsite" });
  });

  it("SmartRecruiters builds job links and reads remote", () => {
    const [p] = mapSmartRecruiters(
      { offset: 0, limit: 100, totalFound: 1, content: [{ id: "744", name: "Data Engineer", location: { city: "Mumbai", country: "in", remote: true } }] },
      "Globex1",
    );
    expect(p.url).toBe("https://jobs.smartrecruiters.com/Globex1/744");
    expect(normalizePosting(p, { name: "Globex" })).toMatchObject({ workMode: "remote", country: "India", remoteScope: "india" });
  });

  it("Recruitee", () => {
    const [p] = mapRecruitee({ offers: [{ id: 1, title: "QA Engineer", careers_url: "https://i.recruitee.com/o/qa", city: "Chennai", country: "India", on_site: true }] });
    expect(normalizePosting(p, { name: "I" })).toMatchObject({ workMode: "onsite", cities: ["Chennai"] });
  });

  it("Workable", () => {
    const [p] = mapWorkable({ jobs: [{ title: "Designer", shortcode: "AB12", city: "Gurgaon", country: "India", telecommuting: false, workplace: "hybrid" }] }, "umbrella");
    expect(p.url).toBe("https://apply.workable.com/umbrella/j/AB12/");
    expect(normalizePosting(p, { name: "U" })).toMatchObject({ workMode: "hybrid", cities: ["Gurugram"] });
  });
});

describe("generic career pages", () => {
  it("reads JobPosting JSON-LD, including @graph", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", name: "Acme" },
        {
          "@type": "JobPosting",
          title: "Platform Engineer",
          url: "/jobs/platform",
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "India" },
          datePosted: "2026-10-05",
          hiringOrganization: { "@type": "Organization", name: "Acme" },
          baseSalary: { currency: "INR", value: { minValue: 1500000, maxValue: 2500000, unitText: "YEAR" } },
        },
      ],
    })}</script>`;
    const [p] = postingsFromJsonLd(html, "https://acme.com/careers");
    expect(p).toMatchObject({ title: "Platform Engineer", url: "https://acme.com/jobs/platform", location: "India" });
    expect(normalizePosting(p, { name: "Acme" })).toMatchObject({ workMode: "remote", remoteScope: "india" });
  });

  it("extracts job cards from links and headings", () => {
    const html = `
      <ul>
        <li><a href="/careers/frontend-engineer"><h3>Frontend Engineer</h3></a><span>Pune, India</span></li>
        <li><a href="/careers/sales-manager">Sales Manager</a></li>
        <li><a href="/careers">Careers</a></li>
        <li><a href="/about">About us</a></li>
      </ul>`;
    const out = postingsFromHtml(html, "https://acme.com/careers");
    expect(out.map((p) => p.title)).toEqual(["Frontend Engineer", "Sales Manager"]);
    expect(out[0].url).toBe("https://acme.com/careers/frontend-engineer");
  });

  it("recognises client-rendered shells", () => {
    expect(looksClientRendered(`<div id="root"></div>${"<script src=x></script>".repeat(5)}`)).toBe(true);
    expect(looksClientRendered(`<main>${"Open roles at Acme. ".repeat(50)}</main>`)).toBe(false);
  });
});

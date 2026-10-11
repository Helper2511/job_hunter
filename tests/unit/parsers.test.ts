import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classifyInbound, extractForwardingConfirmation, parseAlert } from "@/lib/email/parsers";
import { normalizeAlertJobs } from "@/lib/providers/emailAlerts";

const fixture = (name: string) => readFileSync(path.join(__dirname, "../fixtures", name), "utf8");

describe("LinkedIn alerts", () => {
  it("parses the HTML version", () => {
    const jobs = parseAlert("linkedin", fixture("linkedin-alert.html"), null);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      title: "Senior React Developer",
      company: "Acme Tech",
      location: "Pune, Maharashtra, India (Hybrid)",
      url: "https://www.linkedin.com/jobs/view/3912345678/",
      source: "linkedin",
    });
    expect(jobs[1]).toMatchObject({ title: "Frontend Engineer", company: "Bright Labs" });
  });

  it("parses the plain-text version", () => {
    const jobs = parseAlert("linkedin", null, fixture("linkedin-alert.txt"));
    expect(jobs.map((j) => j.title)).toEqual(["Senior React Developer", "Frontend Engineer"]);
    expect(jobs[1].url).toBe("https://www.linkedin.com/jobs/view/3912349999/");
  });

  it("normalises parsed jobs (cities, work mode)", () => {
    const [first, second] = normalizeAlertJobs(parseAlert("linkedin", fixture("linkedin-alert.html"), null));
    expect(first).toMatchObject({ cities: ["Pune"], workMode: "hybrid", country: "India" });
    expect(second).toMatchObject({ workMode: "remote", remoteScope: "india" });
  });
});

describe("Naukri alerts", () => {
  it("parses title, company, experience and salary", () => {
    const jobs = parseAlert("naukri", fixture("naukri-alert.html"), null);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      title: "React JS Developer",
      company: "Globex Solutions",
      location: "Pune",
      experienceText: "3-6 Yrs",
      salaryText: "8-14 LPA",
    });
    const [normalized] = normalizeAlertJobs(jobs);
    expect(normalized).toMatchObject({ experienceMin: 3, experienceMax: 6, salaryMin: 800_000, cities: ["Pune"] });
  });
});

describe("Glassdoor alerts", () => {
  it("parses jobs and keeps the listing id in the link", () => {
    const jobs = parseAlert("glassdoor", fixture("glassdoor-alert.html"), null);
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ title: "Software Engineer II", company: "Umbrella Corp", location: "Hyderabad" });
    expect(jobs[0].url).toContain("jl=1009412345678");
    expect(jobs[0].url).not.toContain("utm_source");
  });
});

describe("classifying inbound mail", () => {
  it("spots alerts from each platform, including forwarded ones", () => {
    expect(classifyInbound("jobalerts-noreply@linkedin.com", "React developer: Acme and more", null, null)).toEqual({ kind: "alert", source: "linkedin" });
    expect(classifyInbound("me@gmail.com", "Fwd: 25 new jobs", "---------- Forwarded message ---------\nFrom: Naukri <info@naukri.com>", null)).toEqual({
      kind: "alert",
      source: "naukri",
    });
    expect(classifyInbound("me@gmail.com", "Fwd: jobs", null, fixture("glassdoor-alert.html"))).toEqual({ kind: "alert", source: "glassdoor" });
  });

  it("spots the forwarding confirmation and pulls out the link and code", () => {
    const text = "Confirmation code: 123456789\n\nTo allow forwarding, click https://mail-settings.google.com/mail/vf-abc123-def\n";
    expect(classifyInbound("forwarding-noreply@google.com", "(#123456789) Gmail Forwarding Confirmation", text, null).kind).toBe("forwarding_confirmation");
    expect(extractForwardingConfirmation(text, null)).toEqual({ link: "https://mail-settings.google.com/mail/vf-abc123-def", code: "123456789" });
  });

  it("ignores other mail", () => {
    expect(classifyInbound("friend@example.com", "Lunch?", "See you at 1", null).kind).toBe("other");
  });
});

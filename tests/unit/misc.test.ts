import { describe, expect, it } from "vitest";
import { nextAction, type TrackerCard } from "@/lib/applications";
import { computeVisibility } from "@/lib/companies/flag";
import { acceptLlmClassification, classifyByRules } from "@/lib/companies/classifyType";
import { findCareerLinks, findHrEmail, parseCompanyInput } from "@/lib/companies/resolve";
import { glassdoorSearchUrl, linkedinSearchUrl, naukriSearchUrl } from "@/lib/deeplinks";
import { buildMime } from "@/lib/email/gmail";
import { pickResume, splitDescription } from "@/lib/jobs/detail";
import { computeSkillsGap, summarizeRole } from "@/lib/prep/skillsGap";
import { templateQuestions } from "@/lib/prep/questions";
import { isPathAllowed, parseRobots } from "@/lib/robots";
import { relativeDate } from "@/lib/utils";

describe("compare and flag", () => {
  const jobs = [
    { id: "c1", title: "Senior React Developer", cities: ["Pune"], source: "career_page" },
    { id: "c2", title: "Data Engineer", cities: ["Pune"], source: "career_page" },
    { id: "p1", title: "React Engineer", cities: ["Pune"], source: "linkedin" },
    { id: "p2", title: "Product Designer", cities: ["Pune"], source: "naukri" },
  ];

  it("flags career-page-only, both and platform-only roles", () => {
    const flags = computeVisibility(jobs, true);
    expect(flags.get("c1")).toBe("BOTH");
    expect(flags.get("p1")).toBe("BOTH");
    expect(flags.get("c2")).toBe("CAREER_PAGE_ONLY");
    expect(flags.get("p2")).toBe("PLATFORM_ONLY");
  });

  it("does not call platform roles closed when the career page was not read", () => {
    expect(computeVisibility(jobs, false).get("p2")).toBe("UNCHECKED");
  });

  it("ignores closed career-page roles", () => {
    const flags = computeVisibility([{ ...jobs[0], closedAt: new Date() }, jobs[2]], true);
    expect(flags.get("p1")).toBe("PLATFORM_ONLY");
  });
});

describe("company type", () => {
  it("accepts a rule result only when one type clearly leads", () => {
    const saas = classifyByRules("Acme is a SaaS platform for payments. Start your free trial or book a demo. See pricing.");
    expect(saas).toMatchObject({ type: "saas", source: "rule", industry: "Fintech" });
    const mixed = classifyByRules("We build products and serve clients.");
    expect(mixed.type).toBe("unknown");
  });

  it("accepts an LLM answer only at confidence 0.7 or higher", () => {
    expect(acceptLlmClassification({ type: "services", confidence: 0.8, reason: "IT consulting", industry: null }).type).toBe("services");
    expect(acceptLlmClassification({ type: "services", confidence: 0.5, reason: "unsure", industry: null }).type).toBe("unknown");
  });
});

describe("company resolution helpers", () => {
  it("tells names from websites", () => {
    expect(parseCompanyInput("https://www.Acme.com/about")).toEqual({ name: null, domain: "acme.com" });
    expect(parseCompanyInput("razorpay.com")).toEqual({ name: null, domain: "razorpay.com" });
    expect(parseCompanyInput("Bright Labs")).toEqual({ name: "Bright Labs", domain: null });
  });

  it("finds careers links and HR emails", () => {
    const html = `<footer><a href="/about">About</a><a href="/careers">Careers</a><a href="mailto:careers@acme.com">Email us</a></footer>`;
    expect(findCareerLinks(html, "https://acme.com")).toEqual(["https://acme.com/careers"]);
    expect(findHrEmail(html)).toBe("careers@acme.com");
    expect(findHrEmail(`<a href="mailto:sales@acme.com">Sales</a>`)).toBeNull();
  });
});

describe("robots.txt", () => {
  const txt = "User-agent: *\nDisallow: /private\nDisallow: /*.pdf$\n\nUser-agent: OtherBot\nDisallow: /";
  it("applies the * group", () => {
    const rules = parseRobots(txt);
    expect(isPathAllowed("/careers", rules)).toBe(true);
    expect(isPathAllowed("/private/x", rules)).toBe(false);
    expect(isPathAllowed("/files/a.pdf", rules)).toBe(false);
  });
  it("prefers a group naming our bot", () => {
    expect(parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: JobHuntHubBot\nDisallow: /admin")).toEqual(["/admin"]);
  });
});

describe("deep links", () => {
  it("prefills keyword, location and work mode", () => {
    expect(linkedinSearchUrl("react developer", "Pune", { workModes: ["remote", "hybrid"] })).toBe(
      "https://www.linkedin.com/jobs/search/?keywords=react+developer&location=Pune&f_WT=2%2C3",
    );
    expect(naukriSearchUrl("react developer", "Pune")).toBe("https://www.naukri.com/react-developer-jobs-in-pune?k=react+developer&l=Pune");
    expect(glassdoorSearchUrl("react", "Pune")).toBe("https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=react&locKeyword=Pune");
  });
});

describe("Gmail message", () => {
  it("builds a multipart message with the resume attached", () => {
    const mime = buildMime(
      { from: "me@gmail.com", fromName: "Asha Rao", to: "careers@acme.com", subject: "Application – Frontend", text: "Hello", attachment: { filename: "resume.pdf", contentType: "application/pdf", data: new Uint8Array([37, 80, 68, 70]) } },
      "b1",
    );
    expect(mime).toContain("To: careers@acme.com");
    expect(mime).toContain("Subject: =?UTF-8?B?");
    expect(mime).toContain('Content-Disposition: attachment; filename="resume.pdf"');
    expect(mime).toContain("JVBERg==");
    expect(mime.endsWith("--b1--\r\n")).toBe(true);
  });
});

describe("interview prep", () => {
  const jd = "You will build React and TypeScript apps.\nRequirements:\nExperience with Node.js, AWS and Docker. Strong system design.";
  it("lists skills missing from the resume", () => {
    const gap = computeSkillsGap(jd, "I build React apps with TypeScript and Node.js.");
    expect(gap.missing).toEqual(expect.arrayContaining(["AWS", "Docker", "System design"]));
    expect(gap.missing).not.toContain("React");
    expect(gap.studyList[0]).toContain(":");
  });
  it("lists every required skill when there is no resume text", () => {
    expect(computeSkillsGap(jd, null).missing).toContain("React");
  });
  it("writes template questions without an LLM", () => {
    const qs = templateQuestions("Frontend Engineer", "Acme", ["React", "TypeScript"]);
    expect(qs.some((q) => q.type === "technical" && q.question.includes("React"))).toBe(true);
    expect(qs.some((q) => q.type === "behavioural")).toBe(true);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });
  it("summarises the role", () => {
    expect(summarizeRole(jd)).toContain("• You will build React and TypeScript apps.");
  });
});

describe("job detail helpers", () => {
  it("splits about and requirements", () => {
    expect(splitDescription("We are hiring.\nRequirements:\n3 years of React")).toEqual({ about: "We are hiring.", requirements: "3 years of React" });
  });
  it("picks the resume for the role type", () => {
    const resumes = [
      { id: "a", roleType: null, isDefault: true },
      { id: "b", roleType: "frontend", isDefault: false },
    ];
    expect(pickResume(resumes, "Senior Frontend Engineer")?.id).toBe("b");
    expect(pickResume(resumes, "Backend Engineer")?.id).toBe("a");
  });
});

describe("tracker", () => {
  const base: TrackerCard = { id: "1", jobId: "j", status: "APPLIED", title: "T", company: "C", appliedAt: "2026-10-01T00:00:00Z", followUpAt: "2026-10-08T00:00:00Z", interviewAt: null, hasPrep: false };
  it("tells the next step", () => {
    expect(nextAction(base, new Date("2026-10-09T00:00:00Z"))).toBe("Follow up today");
    expect(nextAction(base, new Date("2026-10-05T00:00:00Z"))).toBe("Follow up in 3 days");
    expect(nextAction({ ...base, status: "INTERVIEW", interviewAt: "2026-10-12T05:00:00Z" })).toMatch(/^Interview 12 Oct/);
  });
});

describe("dates", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  it("is relative up to 7 days, then a date", () => {
    expect(relativeDate(new Date("2026-10-11T07:00:00Z"), now, true)).toBe("5h");
    expect(relativeDate(new Date("2026-10-09T12:00:00Z"), now)).toBe("2 days ago");
    expect(relativeDate(new Date("2026-09-28T12:00:00Z"), now)).toBe("28 Sep");
  });
});

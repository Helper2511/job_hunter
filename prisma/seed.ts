/**
 * Demo data for local development: a few companies and jobs from every source.
 * Run with `npm run db:seed`. Set SEED_USER_EMAIL to also fill that user's
 * watchlist and tracker (sign in once first so the user exists).
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { computeVisibility } from "../lib/companies/flag";
import { dedupeKey } from "../lib/matching/dedupe";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

const companies = [
  { name: "Acme Tech", domain: "acme.example", companyType: "saas", industry: "Fintech", companyTypeReason: "Website says SaaS and offers a free trial", careersUrl: "https://acme.example/careers", hrEmail: "careers@acme.example" },
  { name: "Bright Labs", domain: "brightlabs.example", companyType: "product", industry: "Consumer apps", companyTypeReason: "Website lists its products and has an app", careersUrl: "https://brightlabs.example/jobs" },
  { name: "Northwind Consulting", domain: "northwind.example", companyType: "services", industry: "IT services", companyTypeReason: "Website offers consulting or IT services", careersUrl: "https://northwind.example/careers" },
  { name: "Globex Auto Parts", domain: "globex.example", companyType: "manufacturing", industry: "Auto parts", companyTypeReason: "Website manufactures goods and runs plants", careersUrl: "https://globex.example/careers" },
  { name: "Initech", domain: "initech.example", companyType: "unknown", industry: null, companyTypeReason: null, careersUrl: null },
];

type Seed = {
  company: string;
  title: string;
  cities: string[];
  workMode: string;
  remoteScope?: string;
  sources: string[];
  days: number;
  exp?: [number, number];
  salary?: string;
  description?: string;
};

const RD = `You will build and ship React and TypeScript features used by thousands of customers.
You will work with designers and backend engineers, review code and improve performance.

Requirements:
3-6 years of experience with React, TypeScript and REST APIs.
Experience with Next.js, testing (Jest or Playwright) and CI/CD.
Good communication skills.`;

const jobs: Seed[] = [
  { company: "Acme Tech", title: "Senior React Developer", cities: ["Pune"], workMode: "hybrid", sources: ["career_page"], days: 2, exp: [4, 7], salary: "18-28 LPA", description: RD },
  { company: "Acme Tech", title: "Backend Engineer (Node.js)", cities: ["Pune"], workMode: "hybrid", sources: ["career_page", "linkedin"], days: 4, exp: [2, 5], description: "Build payment APIs in Node.js and PostgreSQL.\nRequirements:\nNode.js, SQL, AWS, Docker." },
  { company: "Bright Labs", title: "Frontend Engineer", cities: [], workMode: "remote", remoteScope: "india", sources: ["linkedin", "naukri"], days: 0.2, exp: [2, 4], description: RD },
  { company: "Bright Labs", title: "Product Designer", cities: ["Bengaluru"], workMode: "onsite", sources: ["career_page"], days: 6, description: "Design flows in Figma.\nRequirements:\nFigma, accessibility, user research." },
  { company: "Northwind Consulting", title: "Full-stack Engineer", cities: ["Bengaluru"], workMode: "onsite", sources: ["naukri"], days: 1, exp: [3, 6], salary: "12-18 LPA" },
  { company: "Northwind Consulting", title: "React Native Developer", cities: ["Pune", "Mumbai"], workMode: "hybrid", sources: ["glassdoor"], days: 3 },
  { company: "Globex Auto Parts", title: "Data Analyst", cities: ["Chennai"], workMode: "onsite", sources: ["career_page"], days: 10 },
  { company: "Globex Auto Parts", title: "Plant IT Engineer", cities: ["Pune"], workMode: "unknown", sources: ["naukri"], days: 5 },
  { company: "Initech", title: "QA Engineer", cities: ["Hyderabad"], workMode: "hybrid", sources: ["linkedin"], days: 8 },
  { company: "Initech", title: "Platform Engineer", cities: [], workMode: "remote", remoteScope: "worldwide", sources: ["glassdoor"], days: 1.5 },
];

async function main() {
  const byName = new Map<string, string>();
  for (const c of companies) {
    const row = await db.company.upsert({
      where: { domain: c.domain },
      create: { ...c, companyTypeSource: c.companyType === "unknown" ? null : "rule", checkStatus: c.careersUrl ? "ok" : null, lastChecked: c.careersUrl ? ago(0.3) : null, typeCheckedAt: new Date() },
      update: {},
    });
    byName.set(c.name, row.id);
  }

  for (const j of jobs) {
    const companyId = byName.get(j.company)!;
    const key = dedupeKey(j.company, j.title, j.cities, j.workMode);
    for (const source of j.sources) {
      const slug = j.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await db.job.upsert({
        where: { dedupeKey_source: { dedupeKey: key, source } },
        create: {
          companyId,
          title: j.title,
          location: j.cities.join(", ") || (j.workMode === "remote" ? "Remote" : null),
          cities: j.cities,
          country: "India",
          workMode: j.workMode,
          remoteScope: j.remoteScope ?? null,
          url: `https://${source}.example/jobs/${slug}`,
          applyUrl: `https://${source}.example/jobs/${slug}/apply`,
          source,
          description: j.description ?? null,
          experienceMin: j.exp?.[0] ?? null,
          experienceMax: j.exp?.[1] ?? null,
          salaryText: j.salary ?? null,
          postedAt: ago(j.days),
          firstSeenAt: ago(j.days),
          dedupeKey: key,
        },
        update: {},
      });
    }
  }

  for (const companyId of byName.values()) {
    const company = await db.company.findUniqueOrThrow({ where: { id: companyId } });
    const rows = await db.job.findMany({ where: { companyId } });
    const flags = computeVisibility(rows, company.checkStatus === "ok");
    for (const r of rows) await db.job.update({ where: { id: r.id }, data: { visibility: flags.get(r.id) } });
  }

  const email = process.env.SEED_USER_EMAIL;
  if (email) {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`No user with email ${email}. Sign in once, then run the seed again.`);
    } else {
      for (const companyId of byName.values()) {
        await db.companyWatch.upsert({ where: { userId_companyId: { userId: user.id, companyId } }, create: { userId: user.id, companyId }, update: {} });
      }
      const sample = await db.job.findMany({ take: 4, orderBy: { firstSeenAt: "desc" } });
      const statuses = ["SAVED", "APPLIED", "INTERVIEW", "REJECTED"];
      for (const [i, job] of sample.entries()) {
        await db.application.upsert({
          where: { userId_jobId: { userId: user.id, jobId: job.id } },
          create: { userId: user.id, jobId: job.id, status: statuses[i], method: i === 0 ? "saved" : "apply_link", appliedAt: ago(i * 3), followUpAt: i === 1 ? ago(-2) : null },
          update: {},
        });
      }
    }
  }
  console.log(`Seeded ${companies.length} companies and ${jobs.length} roles.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

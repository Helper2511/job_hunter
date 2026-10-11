/**
 * Prepares the database for signed-in browser tests: a test user with a known
 * session token, a clean tracker, then the demo data from prisma/seed.ts.
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../lib/generated/prisma/client";

export const E2E_EMAIL = "e2e@example.com";
export const E2E_TOKEN = process.env.E2E_SESSION_TOKEN ?? "e2e-session-token";

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const user = await db.user.upsert({
    where: { email: E2E_EMAIL },
    create: {
      email: E2E_EMAIL,
      name: "Test User",
      emailVerified: true,
      alertAddress: "alerts-e2etest1@in.example.com",
      locations: ["Pune"],
      roles: ["React developer"],
      phone: "+91 90000 00000",
      noticePeriod: "30 days",
      onboardedAt: new Date(),
    },
    update: {},
  });
  await db.application.deleteMany({ where: { userId: user.id } });
  await db.companyTypeCorrection.deleteMany({ where: { userId: user.id } });
  await db.hiddenJob.deleteMany({ where: { userId: user.id } });
  await db.savedSearch.deleteMany({ where: { userId: user.id } });
  await db.session.upsert({
    where: { token: E2E_TOKEN },
    create: { token: E2E_TOKEN, userId: user.id, expiresAt: new Date(Date.now() + 7 * 86_400_000) },
    update: { expiresAt: new Date(Date.now() + 7 * 86_400_000) },
  });
  await db.$disconnect();
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: { ...process.env, SEED_USER_EMAIL: E2E_EMAIL } });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

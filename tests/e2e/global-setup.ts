import { execSync } from "node:child_process";

/** With E2E_SEED=1 (CI), seed a test user and demo data before the browser tests. */
export default function globalSetup() {
  if (process.env.E2E_SEED !== "1") return;
  execSync("npx tsx tests/e2e/seed-e2e.ts", { stdio: "inherit" });
}

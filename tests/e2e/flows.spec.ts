import { expect, test } from "@playwright/test";
import { canSignIn, signIn } from "./session";

/** Main signed-in flows against the demo data from prisma/seed.ts (see tests/e2e/seed-e2e.ts). */
test.describe("signed-in flows", () => {
  test.skip(!canSignIn, "Set BETTER_AUTH_SECRET and E2E_SEED=1 with a database to run signed-in flows");

  test.beforeEach(async ({ context, baseURL }) => {
    await signIn(context, baseURL!);
  });

  test('"Remote + Hybrid, Pune" shows remote and Pune hybrid roles, no on-site roles elsewhere', async ({ page }) => {
    await page.goto("/jobs?modes=remote,hybrid&loc=Pune");
    const list = page.getByRole("region", { name: "Jobs" });
    await expect(list.getByText(/jobs · sorted by newest/)).toBeVisible();
    await expect(list.getByRole("heading", { name: "Senior React Developer" })).toBeVisible();
    await expect(list.getByRole("heading", { name: "Frontend Engineer" })).toBeVisible();
    await expect(list.getByRole("heading", { name: "Full-stack Engineer" })).toHaveCount(0);
    await expect(list.getByRole("heading", { name: "Data Analyst" })).toHaveCount(0);
  });

  test('filtering by company type "SaaS" keeps only SaaS companies', async ({ page }) => {
    await page.goto("/jobs?types=saas&hideUnclassified=1");
    const list = page.getByRole("region", { name: "Jobs" });
    await expect(list.getByRole("heading", { name: "Senior React Developer" })).toBeVisible();
    await expect(list.getByText("Bright Labs")).toHaveCount(0);
    await expect(list.getByText("Northwind Consulting")).toHaveCount(0);
  });

  test("a career-page-only role carries the tag", async ({ page }) => {
    await page.goto("/jobs?cpo=1");
    const card = page.getByRole("article").filter({ hasText: "Senior React Developer" });
    await expect(card.getByText("Career page only")).toBeVisible();
  });

  test("moves through jobs with the keyboard and opens one", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is a desktop interaction");
    await page.goto("/jobs?all=1");
    await page.getByRole("article").first().getByRole("link").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/jobs\/[a-z0-9]+/);
    await expect(page.getByRole("heading", { name: "About the role" })).toBeVisible();
  });

  test("the apply panel shows copy-ready answers", async ({ page }) => {
    await page.goto("/jobs?all=1");
    await page.getByRole("article").filter({ hasText: "Senior React Developer" }).getByRole("link").click();
    await page.getByRole("button", { name: /^Apply/ }).first().click();
    const panel = page.getByRole("dialog");
    await expect(panel.getByText("Copy-ready answers")).toBeVisible();
    await expect(panel.getByText("+91 90000 00000")).toBeVisible();
  });

  test("moving an application to Interview creates a prep page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Changes shared test data; runs once");
    await page.goto("/applications");
    const applied = page.getByRole("region", { name: "Applied" });
    await applied.getByRole("button", { name: /Move .* to/ }).first().click();
    await page.getByRole("menuitem", { name: "Interview" }).click();
    await expect(page.getByText("Moved to Interview")).toBeVisible();
    await page.getByRole("region", { name: "Interview" }).getByRole("link", { name: "Open interview prep" }).first().click();
    await expect(page.getByRole("heading", { name: "Interview prep" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Skills gap" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Likely questions" })).toBeVisible();
  });

  test("a user can correct a company type for their own view", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Changes shared test data; runs once");
    await page.goto("/companies");
    await page.getByRole("link", { name: "Initech" }).first().click();
    await page.getByRole("button", { name: "Set type" }).click();
    await page.getByRole("menuitem", { name: /^Product/ }).click();
    await expect(page.getByText(/Set by you/)).toBeVisible();
  });

  test("no horizontal scrolling on signed-in pages", async ({ page }) => {
    for (const path of ["/jobs?all=1", "/companies", "/applications", "/settings"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

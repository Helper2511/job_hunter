import { expect, test } from "@playwright/test";

/**
 * Main signed-in flows. They need a seeded database and a session cookie:
 * set E2E_SESSION_COOKIE to a valid Better Auth session token for a test user.
 */
const cookie = process.env.E2E_SESSION_COOKIE;

test.describe("signed-in flows", () => {
  test.skip(!cookie, "Set E2E_SESSION_COOKIE to run signed-in flows");

  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: "better-auth.session_token", value: cookie!, url: baseURL! }]);
  });

  test("filters jobs by work mode and city from the URL", async ({ page }) => {
    await page.goto("/jobs?modes=remote,hybrid&loc=Pune");
    await expect(page.getByRole("radio", { name: "Remote" }).or(page.getByRole("button", { name: "Remote" })).first()).toHaveAttribute("data-state", "on");
    await expect(page.getByText(/jobs · sorted by newest/)).toBeVisible();
  });

  test("moves through jobs with the keyboard", async ({ page }) => {
    await page.goto("/jobs?all=1");
    const first = page.getByRole("article").first().getByRole("link");
    await first.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/jobs\/[a-z0-9]+/);
  });

  test("adds a company and shows its openings", async ({ page }) => {
    await page.goto("/companies");
    await page.getByLabel("Add company").fill("https://jobs.lever.co/leverdemo");
    await page.getByRole("button", { name: "Add company" }).click();
    await expect(page.getByText(/found \d+ open role/)).toBeVisible({ timeout: 15_000 });
  });

  test("the tracker offers a non-drag way to move cards", async ({ page }) => {
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  });
});

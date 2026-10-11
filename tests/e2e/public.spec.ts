import { expect, test } from "@playwright/test";

test("landing page explains the product and offers sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with LinkedIn" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" }).first()).toBeVisible();
  await expect(page.getByText("Spot career-page-only roles")).toBeVisible();
});

test("signed-out visitors are sent to sign-in and come back after", async ({ page }) => {
  await page.goto("/applications");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fapplications/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("no horizontal scrolling on the landing page", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

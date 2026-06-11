import { expect, test } from "./support/fixtures";

test("help topic renders HTML content", async ({ page }) => {
  await page.goto("/help_topics/project");

  await expect(page.getByRole("heading", { name: "Project" })).toBeVisible();
  await expect(page.locator(".help-content")).toContainText("project");
});

test("relative help links navigate without a full page reload", async ({ page }) => {
  await page.goto("/help_topics/plan");
  const beforeNavigation = await page.evaluate(() => window.performance.getEntriesByType("navigation").length);

  await page.getByRole("link", { name: /chained/i }).click();

  await expect(page).toHaveURL("/help_topics/plan/chain");
  await expect(page.getByRole("heading", { name: /Chain/ })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.performance.getEntriesByType("navigation").length))
    .toBe(beforeNavigation);
});

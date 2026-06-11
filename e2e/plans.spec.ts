import { expect, test } from "./support/fixtures";

test("user sees a project's plan list", async ({ page, seeded, loginAs }) => {
  await loginAs();
  await page.goto(`/projects/${seeded.project.name}/plans`);

  await expect(page.getByRole("heading", { name: "Listing Plans" })).toBeVisible();
  await expect(page.getByRole("link", { name: seeded.plan.name })).toBeVisible();
});

test("user opens plan detail and sees status and weather", async ({ page, seeded, loginAs }) => {
  await loginAs();
  await page.goto(`/projects/${seeded.project.name}/plans/${seeded.plan.name}`);

  await expect(page.getByRole("heading", { name: `Plan ${seeded.plan.name}` })).toBeVisible();
  await expect(page.getByText("Success")).toBeVisible();
  await expect(page.getByText("5 of the last 5 builds were successful")).toBeVisible();
});

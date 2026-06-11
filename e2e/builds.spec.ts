import { expect, test } from "./support/fixtures";

test("user navigates build history and opens raw output", async ({ page, seeded, loginAs }) => {
  await loginAs();
  await page.goto(`/projects/${seeded.project.name}/plans/${seeded.plan.name}/builds`);

  await expect(page.getByRole("heading", { name: /Builds of Plan/ })).toBeVisible();
  await expect(page.getByRole("link", { name: String(seeded.builds.finished.position) })).toBeVisible();

  await page.getByRole("link", { name: String(seeded.builds.finished.position) }).click();
  await expect(page).toHaveURL(`/projects/${seeded.project.name}/plans/${seeded.plan.name}/builds/${seeded.builds.finished.position}`);
  await expect(page.getByRole("heading", { name: /Build output of/ })).toBeVisible();
  await expect(page.getByText("Build succeeded")).toBeVisible();
});

test("user stops a running build and sees Stopping status", async ({ page, seeded, loginAs }) => {
  await loginAs();
  await page.goto(`/projects/${seeded.project.name}/plans/${seeded.plan.name}/builds/${seeded.builds.running.position}`);

  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await page.reload();

  await expect(page.getByText("Stopping")).toBeVisible();
});

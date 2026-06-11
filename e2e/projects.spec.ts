import { expect, test } from "./support/fixtures";

test("logged-in user sees the project list", async ({ page, seeded, loginAs }) => {
  await loginAs();
  await page.goto("/projects");

  await expect(page.getByRole("heading", { name: "Listing Projects" })).toBeVisible();
  await expect(page.getByRole("link", { name: seeded.project.name })).toBeVisible();
});

test("user creates a project and lands on its plans page", async ({ page, seeded, loginAs }) => {
  const projectName = `${seeded.project.name}-created`;

  await loginAs();
  await page.goto("/projects/new");
  await page.getByLabel("Name").fill(projectName);
  await page.getByLabel("Description").fill("Created from Playwright");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(`/projects/${projectName}/plans`);
  await expect(page.getByRole("heading", { name: "Listing Plans" })).toBeVisible();
});

test("user edits a project name", async ({ page, seeded, loginAs }) => {
  const updatedName = `${seeded.project.name}-updated`;

  await loginAs();
  await page.goto(`/projects/${seeded.project.name}/edit`);
  await expect(page.getByLabel("Name")).toHaveValue(seeded.project.name);
  await page.getByLabel("Name").fill(updatedName);
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveURL("/projects");
  await expect(page.getByRole("link", { name: updatedName })).toBeVisible();
});

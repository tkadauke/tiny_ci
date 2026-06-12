import { expect, test } from "./support/fixtures";

test("admin manages localhost workers through the workers UI", async ({ page, seeded, loginAs }) => {
  const workerName = `${seeded.worker.name}-new`;
  const updatedName = `${workerName}-updated`;

  await loginAs(seeded.admin);
  await page.goto("/admin/workers");

  await expect(page.getByRole("heading", { name: "Listing Workers" })).toBeVisible();
  await expect(page.getByRole("link", { name: seeded.worker.name })).toBeVisible();

  await page.getByRole("link", { name: "New Worker" }).click();
  await page.getByLabel("Name").fill(workerName);
  await page.getByLabel("Protocol").selectOption("localhost");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(`/admin/workers/${workerName}?flash=Successfully%20created%20worker`);
  await expect(page.getByRole("heading", { name: `Worker ${workerName}` })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByLabel("Name")).toHaveValue(workerName);
  await page.getByLabel("Name").fill(updatedName);
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveURL(`/admin/workers/${updatedName}?flash=Successfully%20updated%20worker`);
  await expect(page.getByRole("heading", { name: `Worker ${updatedName}` })).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL("/admin/workers?flash=Successfully%20deleted%20worker");
  await expect(page.getByRole("link", { name: updatedName })).toHaveCount(0);
});

import { expect, test } from "./support/fixtures";

test("admin manages localhost workers through the slaves UI", async ({ page, seeded, loginAs }) => {
  const workerName = `${seeded.slave.name}-new`;
  const updatedName = `${workerName}-updated`;

  await loginAs(seeded.admin);
  await page.goto("/admin/slaves");

  await expect(page.getByRole("heading", { name: "Listing Slaves" })).toBeVisible();
  await expect(page.getByRole("link", { name: seeded.slave.name })).toBeVisible();

  await page.getByRole("link", { name: "New Slave" }).click();
  await page.getByLabel("Name").fill(workerName);
  await page.getByLabel("Protocol").selectOption("localhost");
  await page.getByRole("button", { name: "Create" }).click();

  await expect(page).toHaveURL(`/admin/slaves/${workerName}?flash=Successfully%20created%20slave`);
  await expect(page.getByRole("heading", { name: `Slave ${workerName}` })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByLabel("Name")).toHaveValue(workerName);
  await page.getByLabel("Name").fill(updatedName);
  await page.getByRole("button", { name: "Update" }).click();

  await expect(page).toHaveURL(`/admin/slaves/${updatedName}?flash=Successfully%20updated%20slave`);
  await expect(page.getByRole("heading", { name: `Slave ${updatedName}` })).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL("/admin/slaves?flash=Successfully%20deleted%20slave");
  await expect(page.getByRole("link", { name: updatedName })).toHaveCount(0);
});

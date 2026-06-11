import { expect, test } from "./support/fixtures";

test("guest logs in with valid credentials", async ({ page, seeded }) => {
  await page.goto("/login");
  await page.getByLabel("User name").fill(seeded.user.login);
  await page.getByLabel("Password").fill(seeded.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(`Welcome, ${seeded.user.login}!`)).toBeVisible();
});

test("login with the wrong password shows an error", async ({ page, seeded }) => {
  await page.goto("/login");
  await page.getByLabel("User name").fill(seeded.user.login);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("alert")).toHaveText("Invalid login or password");
  await expect(page).toHaveURL("/login");
});

test("logged-in user logs out and sees the guest header", async ({ page, loginAs }) => {
  await loginAs();
  await page.getByRole("link", { name: "Logout" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("Welcome, Guest!")).toBeVisible();
});

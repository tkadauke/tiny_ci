import { expect, test as base } from "@playwright/test";

type SeededUser = {
  login: string;
  email: string;
  role: string;
};

type SeededFixture = {
  tag: string;
  password: string;
  user: SeededUser;
  admin: SeededUser;
  project: { name: string };
  plan: { name: string };
  builds: {
    finished: { position: number };
    running: { position: number };
  };
  slave: { name: string };
};

type Fixtures = {
  seeded: SeededFixture;
  loginAs: (user?: SeededUser) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  seeded: async ({ request }, use, testInfo) => {
    const tag = `${testInfo.workerIndex}-${Date.now()}-${testInfo.retry}-${testInfo.repeatEachIndex}`;
    const response = await request.post("/api/e2e/fixture", { data: { tag } });
    expect(response.ok()).toBeTruthy();
    const seeded = (await response.json()) as SeededFixture;

    try {
      await use(seeded);
    } finally {
      await request.delete("/api/e2e/fixture", { data: { tag: seeded.tag } });
    }
  },

  loginAs: async ({ page, seeded }, use) => {
    await use(async (user = seeded.user) => {
      await page.goto("/login");
      await page.getByLabel("User name").fill(user.login);
      await page.getByLabel("Password").fill(seeded.password);
      await page.getByRole("button", { name: "Login" }).click();
      await expect(page).toHaveURL("/");
      await expect(page.getByText(`Welcome, ${user.login}!`)).toBeVisible();
    });
  },
});

export { expect } from "@playwright/test";

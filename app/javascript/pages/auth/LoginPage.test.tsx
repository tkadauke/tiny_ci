import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { server } from "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import LoginPage from "./LoginPage";

test("renders login form with username, password fields and submit button", () => {
  renderWithProviders(<LoginPage onFlash={() => {}} />);

  expect(screen.getByLabelText("User name")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
});

test("successful submit calls the session API and invokes onFlash", async () => {
  const user = userEvent.setup();
  const onFlash = vi.fn();
  let submittedCredentials: unknown;
  server.use(
    http.post("/api/session", async ({ request }) => {
      submittedCredentials = await request.json();
      return HttpResponse.json({
        guest: false,
        login: "admin",
        email: "admin@example.com",
        role: "admin",
        initial_admin: false,
        can_configure_slaves: true,
        can_configure_system_variables: true,
        can_create_accounts: true,
        can_create_projects: true,
        can_edit_projects: true,
        can_create_plans: true,
        can_edit_plans: true,
        can_destroy_plans: true,
      });
    }),
  );

  renderWithProviders(<LoginPage onFlash={onFlash} />);

  await user.type(screen.getByLabelText("User name"), "admin");
  await user.type(screen.getByLabelText("Password"), "secret");
  await user.click(screen.getByRole("button", { name: "Login" }));

  await waitFor(() => expect(onFlash).toHaveBeenCalledWith("Successfully logged in"));
  expect(submittedCredentials).toEqual({ login: "admin", password: "secret" });
});

test("failed submit shows the error message", async () => {
  const user = userEvent.setup();
  server.use(
    http.post("/api/session", () =>
      HttpResponse.json({ error: "Account is locked" }, { status: 422 }),
    ),
  );

  renderWithProviders(<LoginPage onFlash={() => {}} />);

  await user.type(screen.getByLabelText("User name"), "admin");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Login" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Account is locked");
});

import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import SignupPage from "./SignupPage";

describe("SignupPage", () => {
  it("renders all required fields", () => {
    renderWithProviders(<SignupPage onFlash={vi.fn()} />);

    expect(screen.getByLabelText("Login Name")).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Password Confirmation")).toBeInTheDocument();
  });

  it("submits to the users API and flashes success", async () => {
    let submitted: unknown;
    const onFlash = vi.fn();
    server.use(
      http.post("/api/users", async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ login: "sam" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SignupPage onFlash={onFlash} />);

    await user.type(screen.getByLabelText("Login Name"), "sam");
    await user.type(screen.getByLabelText("E-Mail Address"), "sam@example.test");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.type(screen.getByLabelText("Password Confirmation"), "secret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(submitted).toMatchObject({ login: "sam", email: "sam@example.test" }));
    expect(onFlash).toHaveBeenCalledWith("Successfully created account");
  });

  it("displays validation errors", async () => {
    server.use(http.post("/api/users", () => HttpResponse.json({ errors: ["Email is invalid"] }, { status: 422 })));
    const user = userEvent.setup();
    renderWithProviders(<SignupPage onFlash={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Email is invalid")).toBeInTheDocument();
  });
});

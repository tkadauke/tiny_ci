import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import NewPlanPage from "./NewPlanPage";

describe("NewPlanPage", () => {
  it("renders the plan form fields", async () => {
    renderWithProviders(<NewPlanPage projectId="tiny-ci" />);

    expect(await screen.findByRole("heading", { name: "New Plan" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Repository URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Steps")).toBeInTheDocument();
    expect(screen.getByLabelText("Plan requirements")).toBeInTheDocument();
  });

  it("submits successfully through the plans API", async () => {
    let submitted: unknown;
    server.use(
      http.post("/api/projects/:projectId/plans", async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ name: "api-plan", project: { id: 1, name: "tiny-ci" } });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<NewPlanPage projectId="tiny-ci" />);

    await user.type(await screen.findByLabelText("Name"), "api-plan");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(submitted).toMatchObject({ plan: { name: "api-plan" } }));
  });

  it("displays validation errors from the API", async () => {
    server.use(
      http.post("/api/projects/:projectId/plans", () =>
        HttpResponse.json({ errors: ["Name has already been taken"] }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<NewPlanPage projectId="tiny-ci" />);

    await user.click(await screen.findByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name has already been taken")).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import EditPlanPage from "./EditPlanPage";

describe("EditPlanPage", () => {
  it("renders the plan form with existing values", async () => {
    renderWithProviders(<EditPlanPage projectId="tiny-ci" planId="main" />);

    expect(await screen.findByRole("heading", { name: "Edit Plan main" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("main");
    expect(screen.getByLabelText("Description")).toHaveValue("Builds the main branch");
    expect(screen.getByLabelText("Repository URL")).toHaveValue("git@example.test:tiny-ci.git");
  });

  it("submits updates through the plan API", async () => {
    let submitted: unknown;
    server.use(
      http.patch("/api/projects/:projectId/plans/:planId", async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({
          id: 10,
          name: "main",
          description: "Changed",
          repository_url: "",
          steps: "",
          requirements: "",
          parent_id: null,
          previous_plan_id: null,
          project: { id: 1, name: "tiny-ci" },
          can_edit_plans: true,
          root_plan_options: [],
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<EditPlanPage projectId="tiny-ci" planId="main" />);

    const description = await screen.findByLabelText("Description");
    await user.clear(description);
    await user.type(description, "Changed");
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(submitted).toMatchObject({ plan: { description: "Changed" } }));
  });

  it("shows validation errors from the API", async () => {
    server.use(
      http.patch("/api/projects/:projectId/plans/:planId", () =>
        HttpResponse.json({ errors: ["Repository URL is invalid"] }, { status: 422 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<EditPlanPage projectId="tiny-ci" planId="main" />);

    await user.click(await screen.findByRole("button", { name: "Update" }));

    expect(await screen.findByText("Repository URL is invalid")).toBeInTheDocument();
  });
});

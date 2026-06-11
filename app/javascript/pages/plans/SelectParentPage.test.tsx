import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import SelectParentPage from "./SelectParentPage";

describe("SelectParentPage", () => {
  it("lists available parent plans", async () => {
    renderWithProviders(<SelectParentPage projectId="tiny-ci" planId="main" />);

    expect(await screen.findByRole("heading", { name: "Select parent plan for main" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "release" })).toBeInTheDocument();
  });

  it("submits the selected parent through the update API", async () => {
    let submitted: unknown;
    server.use(
      http.patch("/api/projects/:projectId/plans/:planId", async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({
          id: 10,
          name: "main",
          parent_id: 12,
          project: { id: 1, name: "tiny-ci" },
          root_plan_options: [],
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<SelectParentPage projectId="tiny-ci" planId="main" />);

    await user.selectOptions(await screen.findByLabelText("Select Parent Plan"), "12");
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(submitted).toEqual({ parent_id: 12 }));
  });
});

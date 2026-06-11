import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import { planFixture } from "@/test/handlers";
import PlanShowPage from "./PlanShowPage";

describe("PlanShowPage", () => {
  it("renders plan details, last build status, build trigger, and child plans", async () => {
    renderWithProviders(<PlanShowPage projectId="tiny-ci" planId="main" />);

    expect(await screen.findByRole("heading", { name: /Plan main/ })).toBeInTheDocument();
    expect(screen.getByText("Builds the main branch")).toBeInTheDocument();
    expect(screen.getAllByText(/Success/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Build now" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Children" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "child" })).toHaveAttribute("href", "/projects/tiny-ci/plans/child");
  });

  it("does not show the child section when no children exist", async () => {
    server.use(http.get("/api/projects/:projectId/plans/:planId", () => HttpResponse.json({ ...planFixture, children: [] })));

    renderWithProviders(<PlanShowPage projectId="tiny-ci" planId="main" />);

    expect(await screen.findByRole("heading", { name: /Plan main/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Children" })).not.toBeInTheDocument();
  });
});

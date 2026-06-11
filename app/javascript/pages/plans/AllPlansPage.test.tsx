import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import AllPlansPage from "./AllPlansPage";

describe("AllPlansPage", () => {
  it("renders each plan, its weather icon, and links to plan details", async () => {
    renderWithProviders(<AllPlansPage />, { route: "/plans" });

    expect(await screen.findByRole("link", { name: "main" })).toHaveAttribute("href", "/projects/tiny-ci/plans/main");
    expect(screen.getByRole("link", { name: "release" })).toHaveAttribute("href", "/projects/tiny-ci/plans/release");
    expect(screen.getByTitle("4 of the last 5 builds were successful")).toBeInTheDocument();
  });

  it("renders an empty state when no plans exist", async () => {
    server.use(http.get("/api/plans", () => HttpResponse.json([])));

    renderWithProviders(<AllPlansPage />, { route: "/plans" });

    await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "main" })).not.toBeInTheDocument();
    expect(screen.getByText("No plans")).toBeInTheDocument();
  });
});

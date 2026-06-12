import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { buildFixture } from "@/test/handlers";
import { renderWithProviders } from "@/test/test-utils";
import { BuildDetailPage } from "./BuildDetailPage";

describe("BuildDetailPage", () => {
  it("renders build metadata, raw output, tabs, and a finished footer", async () => {
    renderWithProviders(<BuildDetailPage projectId="tiny-ci" planId="main" buildId="7" />);

    expect(await screen.findByRole("heading", { name: /Build output of main #7/ })).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByText("2 minutes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "admin" })).toHaveAttribute("href", "/users/admin");
    expect(screen.getByText("bundle exec rake")).toBeInTheDocument();
    expect(screen.getByText("Running tests")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Stop/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Raw output" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByText("success").length).toBeGreaterThan(0);
  });

  it("shows the stop button and running spinner while running", async () => {
    server.use(
      http.get("/api/projects/:projectId/plans/:planId/builds/:buildId", () =>
        HttpResponse.json({ ...buildFixture, status: "running", status_text: "Running", duration: null }),
      ),
    );

    renderWithProviders(<BuildDetailPage projectId="tiny-ci" planId="main" buildId="7" />);

    expect(await screen.findByRole("button", { name: /Stop/ })).toBeInTheDocument();
    expect(screen.getByAltText("Running")).toHaveAttribute("src", "/assets/spinner.gif");
  });

  it("switches between Raw, Gist, and Details report views", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuildDetailPage projectId="tiny-ci" planId="main" buildId="7" />);

    await screen.findByText("Running tests");
    await user.click(screen.getByRole("link", { name: "Gist" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Gist" })).toHaveAttribute("aria-current", "page"));
    await user.click(screen.getByRole("link", { name: "Details" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute("aria-current", "page"));
    await user.click(screen.getByRole("link", { name: "Raw output" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Raw output" })).toHaveAttribute("aria-current", "page"));
  });
});

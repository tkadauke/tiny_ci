import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import { adminUser, normalUser } from "@/test/handlers";
import ProjectPlansPage from "./ProjectPlansPage";

function renderPage(route = "/projects/tiny-ci/plans") {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/plans" element={<ProjectPlansPage />} />
    </Routes>,
    { route },
  );
}

describe("ProjectPlansPage", () => {
  it("renders project plans with detail links and New Plan for permitted users", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json(adminUser)));

    renderPage();

    expect(await screen.findByRole("link", { name: "main" })).toHaveAttribute("href", "/projects/tiny-ci/plans/main");
    expect(await screen.findByRole("link", { name: "New Plan" })).toHaveAttribute("href", "/projects/tiny-ci/plans/new");
  });

  it("hides New Plan and shows no plan rows for normal users with empty fixtures", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json(normalUser)),
      http.get("/api/projects/:projectId/plans", () => HttpResponse.json([])),
    );

    renderPage();

    await waitFor(() => expect(screen.queryByRole("link", { name: "main" })).not.toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "New Plan" })).not.toBeInTheDocument();
  });
});

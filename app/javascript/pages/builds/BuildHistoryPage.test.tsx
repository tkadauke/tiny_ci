import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes, useParams } from "react-router-dom";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/renderWithProviders";
import { BuildHistoryPage } from "./BuildHistoryPage";

function BuildHistoryRoute() {
  const { projectId = "", planId = "" } = useParams();

  return (
    <BuildHistoryPage
      projectId={projectId}
      planId={planId}
      planName="main"
      stopIconPath="/assets/icons/small/stopped.png"
    />
  );
}

function renderRoute() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId/plans/:planId/builds" element={<BuildHistoryRoute />} />
    </Routes>,
    { route: "/projects/tiny-ci/plans/main/builds" },
  );
}

test("shows a row for each build in the fixture", async () => {
  renderRoute();

  expect(await screen.findByRole("row", { name: /success/i })).toBeInTheDocument();
});

test("stop button is present for non-finished builds", async () => {
  server.use(
    http.get("/api/projects/:projectId/plans/:planId/builds", () =>
      HttpResponse.json([
        {
          id: 102,
          position: 2,
          status: "running",
          status_icon_path: "/assets/icons/small/running.png",
          created_at: "2026-01-01T00:00:00.000Z",
          finished_at: null,
          duration: null,
          starter_login: "admin",
          plan: {
            name: "main",
            project_name: "tiny-ci",
            project_id: "tiny-ci",
            plan_id: "main",
          },
          has_children: false,
          children: [],
        },
      ]),
    ),
  );

  renderRoute();

  const row = await screen.findByRole("row", { name: /running/i });
  expect(within(row).getByRole("button", { name: /stop/i })).toBeInTheDocument();
});

test("stop button is absent for finished builds", async () => {
  renderRoute();

  const row = await screen.findByRole("row", { name: /success/i });
  expect(within(row).queryByRole("button", { name: /stop/i })).not.toBeInTheDocument();
});

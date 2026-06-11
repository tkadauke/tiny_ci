import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import ProjectsPage from "./ProjectsPage";

test("renders a row for each project returned by the MSW fixture", async () => {
  server.use(
    http.get("/api/projects", () =>
      HttpResponse.json([
        { id: 1, name: "tiny-ci", description: "Tiny CI fixture project" },
        { id: 2, name: "docs", description: "Documentation builds" },
      ]),
    ),
  );

  renderWithProviders(<ProjectsPage />);

  const tinyCiRow = await screen.findByRole("row", { name: /tiny-ci/i });
  const docsRow = await screen.findByRole("row", { name: /docs/i });

  expect(tinyCiRow).toBeInTheDocument();
  expect(docsRow).toBeInTheDocument();
});

test("each row links to the project plans page", async () => {
  renderWithProviders(<ProjectsPage />);

  const row = await screen.findByRole("row", { name: /tiny-ci/i });

  expect(within(row).getByRole("link", { name: "tiny-ci" })).toHaveAttribute(
    "href",
    "/projects/tiny-ci/plans",
  );
});

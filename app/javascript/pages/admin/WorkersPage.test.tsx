import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import WorkersPage from "./WorkersPage";

describe("WorkersPage", () => {
  it("renders a row per worker from the fixture", async () => {
    renderWithProviders(<WorkersPage />);

    expect(await screen.findByRole("link", { name: "builder-1" })).toBeInTheDocument();
    expect(screen.getByText("ssh")).toBeInTheDocument();
    expect(screen.getByText("builder.local")).toBeInTheDocument();
  });

  it("shows the add-first-worker link for the empty state", async () => {
    server.use(http.get("/api/admin/workers", () => HttpResponse.json([])));

    renderWithProviders(<WorkersPage />);

    expect(await screen.findByRole("link", { name: "Add the first worker" })).toHaveAttribute("href", "/admin/workers/new");
  });
});

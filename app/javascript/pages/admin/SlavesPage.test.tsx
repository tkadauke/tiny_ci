import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import SlavesPage from "./SlavesPage";

describe("SlavesPage", () => {
  it("renders a row per worker from the fixture", async () => {
    renderWithProviders(<SlavesPage />);

    expect(await screen.findByRole("link", { name: "builder-1" })).toBeInTheDocument();
    expect(screen.getByText("ssh")).toBeInTheDocument();
    expect(screen.getByText("builder.local")).toBeInTheDocument();
  });

  it("shows the add-first-worker link for the empty state", async () => {
    server.use(http.get("/api/admin/slaves", () => HttpResponse.json([])));

    renderWithProviders(<SlavesPage />);

    expect(await screen.findByRole("link", { name: "Add the first slave" })).toHaveAttribute("href", "/admin/slaves/new");
  });
});

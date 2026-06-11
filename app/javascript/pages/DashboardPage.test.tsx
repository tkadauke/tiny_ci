import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@/test/test-utils";
import { http, HttpResponse } from "msw";
import { DashboardPage } from "./DashboardPage";
import { renderWithProviders } from "@/test/test-utils";
import { adminUser, guestUser } from "@/test/handlers";
import { server } from "@/test/server";

describe("DashboardPage", () => {
  it("renders the queue, slave status, and recently finished widgets with fixture data", async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: "Build queue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Slave status" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently finished builds" })).toBeInTheDocument();
    expect(await screen.findByText("builder-1")).toBeInTheDocument();
    expect(screen.getAllByText("tiny-ci")[0]).toBeInTheDocument();
  });

  it("shows quick links for guests and logged-in users", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json(guestUser)));
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/users/new");

    server.use(http.get("/api/me", () => HttpResponse.json(adminUser)));
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("link", { name: "Create accounts" })).toHaveAttribute("href", "/users/new");
  });

  it("shows empty-state messages when dashboard lists are empty", async () => {
    server.use(
      http.get("/api/dashboard", () => HttpResponse.json({ queue: [], slaves: [], recent_builds: [] })),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getAllByText("No builds")).toHaveLength(2));
    expect(screen.getByText(/No slaves configured/)).toBeInTheDocument();
  });
});

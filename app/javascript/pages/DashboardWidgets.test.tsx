import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor, within } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { adminUser, buildFixture, guestUser } from "@/test/handlers";
import { server } from "@/test/server";
import { DashboardPage } from "./DashboardPage";

describe("Dashboard widgets", () => {
  it("renders build queue rows, stop buttons, finished actions, and child build prefixes", async () => {
    const child = { ...buildFixture, id: 103, position: 2, status: "pending" };
    server.use(
      http.get("/api/me", () => HttpResponse.json(adminUser)),
      http.get("/api/dashboard", () =>
        HttpResponse.json({
          queue: [
            { ...buildFixture, id: 101, position: 1, status: "pending", children: [child] },
            { ...buildFixture, id: 102, position: 3, status: "success", children: [] },
          ],
          workers: [],
          recent_builds: [],
        }),
      ),
    );

    renderWithProviders(<DashboardPage />);

    await screen.findByRole("link", { name: "1" });
    const queue = screen.getByRole("heading", { name: "Build queue" });
    const section = queue.closest("section") as HTMLElement;
    expect(within(section).getByRole("link", { name: "1" })).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "2" }).closest("td")).toHaveTextContent("+ 2");
    expect(within(section).getByRole("link", { name: "2" })).toBeInTheDocument();
    expect(within(section).getAllByRole("button", { name: /Stop/ })).toHaveLength(2);
  });

  it("renders recently finished builds with duration and blank nil duration", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json(adminUser)),
      http.get("/api/dashboard", () =>
        HttpResponse.json({
          queue: [],
          workers: [],
          recent_builds: [
            { ...buildFixture, id: 201, position: 7, duration: 120 },
            { ...buildFixture, id: 202, position: 8, duration: null },
          ],
        }),
      ),
    );

    renderWithProviders(<DashboardPage />);

    await screen.findByText("2 minutes");
    const recent = screen.getByRole("heading", { name: "Recently finished builds" }).closest("section") as HTMLElement;
    expect(within(recent).getByText("2 minutes")).toBeInTheDocument();
    expect(within(recent).getByRole("link", { name: "8" }).closest("tr")).toHaveTextContent(/success\s*$/);
    expect(within(recent).queryByRole("button", { name: /Stop/ })).not.toBeInTheDocument();
  });

  it("renders worker status states", async () => {
    server.use(
      http.get("/api/me", () => HttpResponse.json(adminUser)),
      http.get("/api/dashboard", () =>
        HttpResponse.json({
          queue: [],
          workers: [
            { name: "offline-worker", offline: true, running_builds: [] },
            { name: "idle-worker", offline: false, running_builds: [] },
            { name: "busy-worker", offline: false, running_builds: [{ ...buildFixture, status: "running" }] },
          ],
          recent_builds: [],
        }),
      ),
    );

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText("offline-worker")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure" })).toHaveAttribute("href", "/admin/workers/offline-worker/edit");
    expect(screen.getByText("idle-worker").closest("li")).toHaveTextContent("No builds");
    expect(screen.getByText("busy-worker").closest("li")).toHaveTextContent("running");
  });

  it("renders quick links for initial admin, account creators, and guests", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json({ ...guestUser, initial_admin: true })));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByRole("link", { name: "Create first administrator account" })).toHaveAttribute(
      "href",
      "/users/new",
    );

    server.use(http.get("/api/me", () => HttpResponse.json(adminUser)));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByRole("link", { name: "Create accounts" })).toHaveAttribute("href", "/users/new");

    server.use(http.get("/api/me", () => HttpResponse.json(guestUser)));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/users/new");
    const projectLinks = screen.getAllByRole("link", { name: "Create a project" });
    const workerLinks = screen.getAllByRole("link", { name: "Manage build workers" });
    expect(projectLinks[projectLinks.length - 1]).toHaveAttribute("href", "/projects/new");
    expect(workerLinks[workerLinks.length - 1]).toHaveAttribute("href", "/admin/workers");
  });

  it("renders empty states for dashboard widgets", async () => {
    server.use(http.get("/api/dashboard", () => HttpResponse.json({ queue: [], workers: [], recent_builds: [] })));

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getAllByText("No builds")).toHaveLength(2));
    expect(screen.getByText(/No workers configured/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure them now" })).toHaveAttribute("href", "/admin/workers");
  });
});

import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { adminUser, guestUser, normalUser } from "@/test/handlers";
import { server } from "@/test/server";
import Navigation from "./Navigation";

describe("Navigation", () => {
  it("always renders the common links", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json(guestUser)));

    renderWithProviders(<Navigation />);

    expect(await screen.findByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "All Plans" })).toHaveAttribute("href", "/plans");
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/users");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help_topics");
  });

  it("shows admin links only for users with configuration permissions", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json(adminUser)));

    const adminRender = renderWithProviders(<Navigation />);

    expect(await screen.findByRole("link", { name: "Slaves" })).toHaveAttribute("href", "/admin/slaves");
    expect(screen.getByRole("link", { name: "Configuration" })).toHaveAttribute("href", "/admin/configuration");
    adminRender.unmount();

    server.use(http.get("/api/me", () => HttpResponse.json(normalUser)));
    renderWithProviders(<Navigation />);

    expect(await screen.findByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Slaves" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Configuration" })).not.toBeInTheDocument();
  });
});

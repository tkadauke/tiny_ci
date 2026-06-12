import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { adminUser, guestUser } from "@/test/handlers";
import { server } from "@/test/server";
import { FlashProvider } from "@/components/ui/FlashMessage";
import Header from "./Header";

function renderHeader() {
  return renderWithProviders(
    <FlashProvider>
      <Header />
    </FlashProvider>,
  );
}

describe("Header", () => {
  it("shows guest actions and welcome text", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json(guestUser)));

    renderHeader();

    expect(await screen.findByText("Welcome, Guest!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Signup" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
  });

  it("shows logged-in actions and welcome text", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json(adminUser)));

    renderHeader();

    expect(await screen.findByText("Welcome, admin!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Signup" })).not.toBeInTheDocument();
  });
});

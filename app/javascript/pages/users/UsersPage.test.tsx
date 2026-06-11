import { describe, expect, it } from "vitest";
import { screen } from "@/test/test-utils";
import { adminUser, normalUser } from "@/test/handlers";
import { renderWithProviders } from "@/test/test-utils";
import UsersPage from "./UsersPage";

describe("UsersPage", () => {
  it("renders a row per user and admin-only account actions", async () => {
    renderWithProviders(<UsersPage currentUser={adminUser} />);

    expect(await screen.findByRole("link", { name: "admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "jane" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Edit" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "New Account" })).toBeInTheDocument();
  });

  it("lets a normal user edit only their own row", async () => {
    renderWithProviders(<UsersPage currentUser={normalUser} />);

    expect(await screen.findByRole("link", { name: "admin" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Edit" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "New Account" })).not.toBeInTheDocument();
  });
});

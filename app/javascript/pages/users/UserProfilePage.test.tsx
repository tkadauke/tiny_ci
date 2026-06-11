import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@/test/test-utils";
import { adminUser, normalUser } from "@/test/handlers";
import { renderWithProviders } from "@/test/test-utils";
import type { CurrentUser } from "@/hooks/useCurrentUser";
import UserProfilePage from "./UserProfilePage";

function renderPage(currentUser: CurrentUser = normalUser, route = "/users/jane") {
  return renderWithProviders(
    <Routes>
      <Route path="/users/:login" element={<UserProfilePage currentUser={currentUser} />} />
    </Routes>,
    { route },
  );
}

describe("UserProfilePage", () => {
  it("shows the target user's login as the heading", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "jane's Profile" })).toBeInTheDocument();
  });

  it("shows Edit Profile for own profile or admin only", async () => {
    const ownProfile = renderPage(normalUser, "/users/jane");
    expect(await screen.findByRole("link", { name: "Edit profile" })).toBeInTheDocument();
    ownProfile.unmount();

    const otherProfile = renderPage(normalUser, "/users/admin");
    expect(await screen.findByRole("heading", { name: "admin's Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit profile" })).not.toBeInTheDocument();
    otherProfile.unmount();

    renderPage(adminUser, "/users/jane");
    expect(await screen.findByRole("link", { name: "Edit profile" })).toBeInTheDocument();
  });
});

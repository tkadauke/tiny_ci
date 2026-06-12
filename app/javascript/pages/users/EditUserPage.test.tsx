import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@/test/test-utils";
import { adminUser, normalUser } from "@/test/handlers";
import { renderWithProviders } from "@/test/test-utils";
import type { LoggedInCurrentUser } from "@/hooks/useCurrentUser";
import EditUserPage from "./EditUserPage";

function renderPage(currentUser: LoggedInCurrentUser = normalUser, onFlash = vi.fn(), route = "/users/jane/edit") {
  return {
    onFlash,
    ...renderWithProviders(
      <Routes>
        <Route path="/users/:login/edit" element={<EditUserPage currentUser={currentUser} onFlash={onFlash} />} />
        <Route path="/users/:login" element={<p>Profile route</p>} />
      </Routes>,
      { route },
    ),
  };
}

describe("EditUserPage", () => {
  it("renders an editable email field", async () => {
    renderPage();

    expect(await screen.findByLabelText("E-Mail Address")).toHaveValue("jane@example.test");
  });

  it("shows the role select only when an admin edits another user", async () => {
    renderPage(normalUser);
    expect(await screen.findByLabelText("E-Mail Address")).toBeInTheDocument();
    expect(screen.queryByLabelText("Role")).not.toBeInTheDocument();

    renderPage(adminUser);
    expect(await screen.findByLabelText("Role")).toBeInTheDocument();
  });

  it("shows a success flash after saving", async () => {
    const user = userEvent.setup();
    const onFlash = vi.fn();
    renderPage(normalUser, onFlash);

    const email = await screen.findByLabelText("E-Mail Address");
    await user.clear(email);
    await user.type(email, "new@example.test");
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(onFlash).toHaveBeenCalledWith("Successfully updated jane's profile"));
  });
});

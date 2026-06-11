import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import UserSettingsPage from "./UserSettingsPage";

describe("UserSettingsPage", () => {
  it("renders the user settings form", async () => {
    renderWithProviders(<UserSettingsPage />);

    expect(await screen.findByLabelText("Site name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("shows a success flash after submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserSettingsPage />);

    await user.click(await screen.findByRole("button", { name: "Update" }));

    expect(await screen.findByText("Successfully updated configuration")).toBeInTheDocument();
  });

  it("shows an API error on submit failure", async () => {
    server.use(http.post("/api/settings", () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderWithProviders(<UserSettingsPage />);

    await user.click(await screen.findByRole("button", { name: "Update" }));

    expect(await screen.findByText("Failed to update user settings (500)")).toBeInTheDocument();
  });
});

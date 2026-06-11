import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import AdminConfigPage from "./AdminConfigPage";

describe("AdminConfigPage", () => {
  it("renders config option fields from the fixture", async () => {
    renderWithProviders(<AdminConfigPage />);

    await waitFor(() => expect(screen.getByLabelText("Site name")).toHaveValue("Tiny CI"));
    expect(screen.getByLabelText("Locale")).toHaveValue("en");
  });

  it("shows a success flash after submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminConfigPage />);

    await user.click(await screen.findByRole("button", { name: "Update" }));

    expect(await screen.findByText("Successfully updated configuration")).toBeInTheDocument();
  });

  it("shows an API error on submit failure", async () => {
    server.use(http.post("/api/admin/configuration", () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderWithProviders(<AdminConfigPage />);

    await user.click(await screen.findByRole("button", { name: "Update" }));

    expect(await screen.findByText("Failed to update configuration (500)")).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import EditSlavePage from "./EditSlavePage";

describe("EditSlavePage", () => {
  it("renders existing worker fields", async () => {
    renderWithProviders(<EditSlavePage name="builder-1" />);

    expect(await screen.findByLabelText("Name")).toHaveValue("builder-1");
    expect(screen.getByLabelText("Host Name")).toHaveValue("builder.local");
    expect(screen.getByLabelText("Protocol")).toHaveValue("ssh");
  });

  it("submits updates through the worker API", async () => {
    let submitted: unknown;
    server.use(
      http.patch("/api/admin/slaves/:name", async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ name: "builder-1" });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<EditSlavePage name="builder-1" />);

    const hostname = await screen.findByLabelText("Host Name");
    await user.clear(hostname);
    await user.type(hostname, "new-builder.local");
    await user.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => expect(submitted).toMatchObject({ slave: { hostname: "new-builder.local" } }));
  });

  it("shows API errors", async () => {
    server.use(http.patch("/api/admin/slaves/:name", () => HttpResponse.json({ errors: ["Hostname is invalid"] }, { status: 422 })));
    const user = userEvent.setup();
    renderWithProviders(<EditSlavePage name="builder-1" />);

    await user.click(await screen.findByRole("button", { name: "Update" }));

    expect(await screen.findByText("Hostname is invalid")).toBeInTheDocument();
  });
});

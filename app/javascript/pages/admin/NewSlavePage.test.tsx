import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/test-utils";
import NewSlavePage from "./NewSlavePage";

describe("NewSlavePage", () => {
  it("renders all worker form fields", () => {
    renderWithProviders(<NewSlavePage />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Host Name")).toBeInTheDocument();
    expect(screen.getByLabelText("User Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Protocol")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum Builds")).toBeInTheDocument();
    expect(screen.getByLabelText("Slave Capabilities")).toBeInTheDocument();
  });

  it("submits through the create API", async () => {
    let submitted: unknown;
    server.use(
      http.post("/api/admin/slaves", async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ name: "worker-2" }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<NewSlavePage />);

    await user.type(screen.getByLabelText("Name"), "worker-2");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(submitted).toMatchObject({ slave: { name: "worker-2" } }));
  });

  it("shows API errors", async () => {
    server.use(http.post("/api/admin/slaves", () => HttpResponse.json({ errors: ["Name is required"] }, { status: 422 })));
    const user = userEvent.setup();
    renderWithProviders(<NewSlavePage />);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { slaveFixture } from "@/test/handlers";
import SlaveForm from "./SlaveForm";

describe("SlaveForm", () => {
  it("renders all worker fields and protocol options", () => {
    renderWithProviders(<SlaveForm slave={slaveFixture} submitLabel="Update" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Offline")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("builder-1");
    expect(screen.getByLabelText("Protocol")).toHaveValue("ssh");
    expect(within(screen.getByLabelText("Protocol")).getByRole("option", { name: "localhost" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Protocol")).getByRole("option", { name: "ssh" })).toBeInTheDocument();
    expect(screen.getByLabelText("Host Name")).toBeInTheDocument();
    expect(screen.getByLabelText("User Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Base Path")).toBeInTheDocument();
    expect(screen.getByText("Environment Variables")).toBeInTheDocument();
    expect(screen.getByLabelText("Slave Capabilities")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum Builds")).toBeInTheDocument();
  });

  it("submits changed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<SlaveForm slave={slaveFixture} submitLabel="Update" onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "worker-2");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "worker-2" }));
  });
});

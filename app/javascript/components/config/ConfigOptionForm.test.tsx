import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { configOptionsFixture } from "@/test/handlers";
import ConfigOptionForm from "./ConfigOptionForm";

describe("ConfigOptionForm", () => {
  it("renders a field for each visible option", () => {
    renderWithProviders(<ConfigOptionForm options={configOptionsFixture} submitLabel="Update" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Site name")).toHaveValue("Tiny CI");
    expect(screen.getByLabelText("Locale")).toHaveValue("en");
  });

  it("submits changed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<ConfigOptionForm options={configOptionsFixture} submitLabel="Update" onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText("Site name"));
    await user.type(screen.getByLabelText("Site name"), "Tiny CI Test");
    await user.selectOptions(screen.getByLabelText("Locale"), "de");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onSubmit).toHaveBeenCalledWith({ site_name: "Tiny CI Test", locale: "de" });
  });
});

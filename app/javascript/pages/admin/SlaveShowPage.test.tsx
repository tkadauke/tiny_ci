import { describe, expect, it } from "vitest";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import SlaveShowPage from "./SlaveShowPage";

describe("SlaveShowPage", () => {
  it("renders worker details", async () => {
    renderWithProviders(<SlaveShowPage name="builder-1" />);

    expect(await screen.findByRole("heading", { name: "Slave builder-1" })).toBeInTheDocument();
    expect(screen.getByText("ssh")).toBeInTheDocument();
    expect(screen.getByText("builder.local")).toBeInTheDocument();
    expect(screen.getByText("ruby,node")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/admin/slaves/builder-1/edit");
  });
});

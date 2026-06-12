import { describe, expect, it } from "vitest";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import WorkerShowPage from "./WorkerShowPage";

describe("WorkerShowPage", () => {
  it("renders worker details", async () => {
    renderWithProviders(<WorkerShowPage name="builder-1" />);

    expect(await screen.findByRole("heading", { name: "Worker builder-1" })).toBeInTheDocument();
    expect(screen.getByText("ssh")).toBeInTheDocument();
    expect(screen.getByText("builder.local")).toBeInTheDocument();
    expect(screen.getByText("ruby,node")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/admin/workers/builder-1/edit");
  });
});

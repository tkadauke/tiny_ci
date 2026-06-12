import { describe, expect, it } from "vitest";
import { screen, within } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { planFixture } from "@/test/handlers";
import { PlanList } from "./PlanList";

describe("PlanList", () => {
  it("renders plan rows in list mode with name, status, and weather", () => {
    renderWithProviders(<PlanList plans={[planFixture]} mode="list" />);

    expect(screen.getByRole("link", { name: "main" })).toHaveAttribute("href", "/projects/tiny-ci/plans/main");
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByTitle("4 of the last 5 builds were successful")).toBeInTheDocument();
  });

  it("renders plan rows in overview mode", () => {
    renderWithProviders(<PlanList plans={[planFixture]} mode="overview" />);

    const overview = document.querySelector(".plan-overview");
    expect(overview).not.toBeNull();
    expect(within(overview as HTMLElement).getByRole("link", { name: "main" })).toHaveAttribute(
      "href",
      "/projects/tiny-ci/plans/main",
    );
  });

  it("renders an empty state", () => {
    renderWithProviders(<PlanList plans={[]} mode="list" />);

    expect(screen.getByText("No plans")).toBeInTheDocument();
  });
});

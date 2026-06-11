import { describe, expect, it } from "vitest";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import Breadcrumbs from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders an entry for each path segment", () => {
    renderWithProviders(<Breadcrumbs />, { route: "/projects/tiny-ci/plans/main/builds/7" });

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "tiny-ci" })).toHaveAttribute("href", "/projects/tiny-ci");
    expect(screen.getByRole("link", { name: "Plans" })).toHaveAttribute("href", "/projects/tiny-ci/plans");
    expect(screen.getByRole("link", { name: "main" })).toHaveAttribute("href", "/projects/tiny-ci/plans/main");
    expect(screen.getByRole("link", { name: "Builds" })).toHaveAttribute("href", "/projects/tiny-ci/plans/main/builds");
    expect(screen.getByText(/7$/)).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import { screen } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { GistReport } from "./GistReport";

const rows = [
  { index: 0, timestamp: 0, command: "rake test:units", line: "** Execute test:units" },
  { index: 1, timestamp: 1, command: "rake test:units", line: "test_failure(UserTest): F" },
  { index: 2, timestamp: 2, command: "rake test:units", line: "Finished in 0.25 seconds." },
  { index: 3, timestamp: 3, command: "rake test:units", line: "1 tests, 2 assertions, 1 failures, 0 errors" },
];

describe("GistReport", () => {
  it("renders build metadata and task summary without per-test-case details", () => {
    renderWithProviders(<GistReport rows={rows} />);

    expect(screen.getByRole("link", { name: "Build" })).toBeInTheDocument();
    expect(screen.getByText("Build tool").nextSibling).toHaveTextContent("rake");
    expect(screen.getByText("Targets").nextSibling).toHaveTextContent("test:units");
    expect(screen.getByRole("link", { name: "Test Run test:units" })).toBeInTheDocument();
    expect(screen.getByText("Total time").nextSibling).toHaveTextContent("0.25");
    expect(screen.queryByText("test_failure")).not.toBeInTheDocument();
  });
});

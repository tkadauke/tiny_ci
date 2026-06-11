import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@/test/test-utils";
import { renderWithProviders } from "@/test/test-utils";
import { DetailsReport } from "./DetailsReport";

const rows = [
  { index: 0, timestamp: 0, command: "bundle exec rake test:units", line: "** Execute db:migrate" },
  { index: 1, timestamp: 1, command: "bundle exec rake test:units", line: "Migrating" },
  { index: 2, timestamp: 2, command: "bundle exec rake test:units", line: "** Execute test:units" },
  { index: 3, timestamp: 3, command: "bundle exec rake test:units", line: "test_failure(UserTest): F" },
  { index: 4, timestamp: 4, command: "bundle exec rake test:units", line: "1) Failure:" },
  { index: 5, timestamp: 5, command: "bundle exec rake test:units", line: "test_failure(UserTest)" },
  { index: 6, timestamp: 6, command: "bundle exec rake test:units", line: "[test/unit/user_test.rb:12]:" },
  { index: 7, timestamp: 7, command: "bundle exec rake test:units", line: "Expected true to be false." },
  { index: 8, timestamp: 8, command: "bundle exec rake test:units", line: "" },
  { index: 9, timestamp: 9, command: "bundle exec rake test:units", line: "Finished in 0.125 seconds." },
  { index: 10, timestamp: 10, command: "bundle exec rake test:units", line: "1 tests, 1 assertions, 1 failures, 0 errors" },
];

describe("DetailsReport", () => {
  it("renders build metadata, expandable tasks, summary, and hidden failure details", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DetailsReport rows={rows} />);

    expect(screen.getByText("Build tool").nextSibling).toHaveTextContent("rake");
    expect(screen.getByText("Targets").nextSibling).toHaveTextContent("test:units");
    expect(screen.getByRole("link", { name: "Task db:migrate" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Test Run test:units" })).toBeInTheDocument();
    expect(screen.getByText("Total time").nextSibling).toHaveTextContent("0.125");
    expect(screen.getByText("Tests").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Assertions").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Failures").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Errors").nextSibling).toHaveTextContent("0");

    const failure = screen.getByRole("link", { name: "test_failure" });
    expect(screen.queryByText("Expected true to be false.")).not.toBeInTheDocument();
    await user.click(failure);

    expect(screen.getByText("Expected true to be false.")).toBeInTheDocument();
    expect(within(screen.getByText("Expected true to be false.").closest("tr") as HTMLElement).getByText("failure")).toBeInTheDocument();
  });
});

import { describe, expect, it } from "vitest";
import { parseOutputRows, parseReports } from "./reportParser";

describe("reportParser", () => {
  it("parses raw CSV output rows", () => {
    expect(parseOutputRows('1.5,rake,"first line"\n2.5,"bundle exec rake","quoted, line"\n')).toEqual([
      { index: 0, timestamp: 1.5, command: "rake", line: "first line" },
      { index: 1, timestamp: 2.5, command: "bundle exec rake", line: "quoted, line" },
    ]);
  });

  it("parses rake build reports with targets and test details", () => {
    const reports = parseReports([
      { index: 0, timestamp: 0, command: "bundle exec rake test:units", line: "** Execute test:units" },
      { index: 1, timestamp: 1, command: "bundle exec rake test:units", line: "test_failure(UserTest): F" },
      { index: 2, timestamp: 2, command: "bundle exec rake test:units", line: "test_success(UserTest): ." },
      { index: 3, timestamp: 3, command: "bundle exec rake test:units", line: "1) Failure:" },
      { index: 4, timestamp: 4, command: "bundle exec rake test:units", line: "test_failure(UserTest)" },
      { index: 5, timestamp: 5, command: "bundle exec rake test:units", line: "[test/unit/user_test.rb:12]:" },
      { index: 6, timestamp: 6, command: "bundle exec rake test:units", line: "Expected true to be false." },
      { index: 7, timestamp: 7, command: "bundle exec rake test:units", line: "" },
      { index: 8, timestamp: 8, command: "bundle exec rake test:units", line: "Finished in 0.123 seconds." },
      { index: 9, timestamp: 9, command: "bundle exec rake test:units", line: "2 tests, 3 assertions, 1 failures, 0 errors" },
    ]);

    expect(reports[0]).toMatchObject({
      type: "build",
      buildTool: "rake",
      targets: "test:units",
      tasks: [
        {
          type: "test",
          name: "test:units",
          summary: { totalTime: "0.123", tests: "2", assertions: "3", failures: "1", errors: "0" },
        },
      ],
    });
  });
});

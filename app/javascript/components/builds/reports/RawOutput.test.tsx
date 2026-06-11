import { render, screen, within } from "@testing-library/react";
import { RawOutput } from "./RawOutput";

test("renders timestamp, command, and line text for each row", () => {
  render(
    <RawOutput
      rows={[
        { index: 0, timestamp: 1_767_225_600, command: "npm test", line: "Tests passed" },
        { index: 1, timestamp: 1_767_225_661, command: "npm build", line: "Build passed" },
      ]}
    />,
  );

  expect(screen.getByText("npm test")).toBeInTheDocument();
  expect(screen.getByText("Tests passed")).toBeInTheDocument();
  expect(screen.getByText("npm build")).toBeInTheDocument();
  expect(screen.getByText("Build passed")).toBeInTheDocument();
  const timestampCells = document.querySelectorAll(".timestamp");
  expect(timestampCells[0]).toHaveTextContent(/\d{2}:\d{2}:\d{2}/);
  expect(timestampCells[1]).toHaveTextContent(/\d{2}:\d{2}:\d{2}/);
});

test("suppresses repeated timestamp when integer value matches previous row", () => {
  render(
    <RawOutput
      rows={[
        { index: 0, timestamp: 1_767_225_600.1, command: "npm test", line: "one" },
        { index: 1, timestamp: 1_767_225_600.9, command: "npm build", line: "two" },
      ]}
    />,
  );

  const rows = screen.getAllByRole("row");
  expect(rows[0].querySelector(".timestamp")).toHaveTextContent(/\d{2}:\d{2}:\d{2}/);
  expect(rows[1].querySelector(".timestamp")).toHaveTextContent("");
});

test("suppresses repeated command when it matches previous row", () => {
  render(
    <RawOutput
      rows={[
        { index: 0, timestamp: 1_767_225_600, command: "npm test", line: "one" },
        { index: 1, timestamp: 1_767_225_601, command: "npm test", line: "two" },
      ]}
    />,
  );

  const rows = screen.getAllByRole("row");
  expect(within(rows[0]).getByText("npm test")).toBeInTheDocument();
  expect(rows[1].querySelector(".command")).toHaveTextContent("");
});

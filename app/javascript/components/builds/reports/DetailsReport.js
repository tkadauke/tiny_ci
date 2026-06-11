import React, { useMemo, useState } from "react"
import { parseReports } from "lib/reportParser"
import { RawOutput } from "components/builds/reports/RawOutput"

const h = React.createElement

export function DetailsReport({ rows }) {
  const reports = useMemo(() => parseReports(rows), [rows])
  if (!reports.length) return null

  return h("ul", null,
    reports.map((report, index) =>
      h("li", { key: index }, h(ReportDetails, { report }))
    )
  )
}

function ReportDetails({ report }) {
  if (report.type === "build") return h(BuildReportDetails, { report })
  return h(DeployReportDetails, { report })
}

function ExpandableSection({ label, children }) {
  const [expanded, setExpanded] = useState(true)

  return h(React.Fragment, null,
    h("a", {
      href: "#",
      onClick(event) {
        event.preventDefault()
        setExpanded((current) => !current)
      },
    }, label),
    h("div", { style: { display: expanded ? undefined : "none" } }, children)
  )
}

function BuildReportDetails({ report }) {
  return h(ExpandableSection, { label: "Build" },
      h("dl", null,
        h("dt", null, "Build tool"),
        h("dd", null, report.buildTool, "\u00a0"),
        h("dt", null, "Targets"),
        h("dd", null, report.targets, "\u00a0")
      ),
      h("h2", null, "Tasks"),
      h("ul", { className: "tasks" },
        report.tasks.map((task, index) =>
          h("li", { key: `${task.name}-${index}` }, h(TaskDetails, { task }))
        )
      )
  )
}

function TaskDetails({ task }) {
  if (task.type === "test") return h(TestReportDetails, { report: task })

  return h(ExpandableSection, { label: `Task ${task.name}` },
    task.rawOutput.length ? h(RawOutput, { rows: task.rawOutput }) : null
  )
}

function TestReportDetails({ report }) {
  const tests = [...report.tests].sort((a, b) => a.name.localeCompare(b.name))

  return h(ExpandableSection, { label: `Test Run ${report.name}` },
      h("h3", null, "Summary"),
      h(TestSummaryList, { report }),
      h("h3", null, "Details"),
      h("ul", { className: "test-report" },
        tests.map((test) =>
          h("li", { key: test.name },
            h(ExpandableSection, { label: test.name },
              h("table", null,
                h("thead", null,
                  h("tr", null,
                    h("th", { className: "name" }, "Test Case"),
                    h("th", { className: "duration" }, "Duration"),
                    h("th", { className: "status" }, "Status")
                  )
                ),
                h("tbody", null,
                  test.testCases.map((testCase, index) =>
                    h(TestCaseRow, { key: `${testCase.name}-${index}`, testCase })
                  )
                )
              )
            )
          )
        )
      )
  )
}

function TestSummaryList({ report }) {
  return h("dl", null,
    h("dt", null, "Total time"),
    h("dd", null, report.summary.totalTime, "\u00a0"),
    h("dt", null, "Tests"),
    h("dd", null, report.summary.tests, "\u00a0"),
    h("dt", null, "Assertions"),
    h("dd", null, report.summary.assertions, "\u00a0"),
    h("dt", null, "Failures"),
    h("dd", null, report.summary.failures, "\u00a0"),
    h("dt", null, "Errors"),
    h("dd", null, report.summary.errors, "\u00a0")
  )
}

function TestCaseRow({ testCase }) {
  const [expanded, setExpanded] = useState(false)
  const hasFailureDetails = testCase.status !== "success"

  return h("tr", { className: testCase.status },
    h("td", { className: "name" },
      hasFailureDetails
        ? h(React.Fragment, null,
            h("a", {
              href: "#",
              onClick(event) {
                event.preventDefault()
                setExpanded((current) => !current)
              },
            }, testCase.name),
            expanded
              ? h("div", null,
                  testCase.errorMessage ? h("strong", null, testCase.errorMessage) : null,
                  testCase.backtrace?.length
                    ? h("table", null,
                        h("tbody", null,
                          testCase.backtrace.map((invocation, index) =>
                            h("tr", { key: index },
                              h("td", null, invocation[0]),
                              h("td", null, invocation[1]),
                              h("td", null, invocation[2])
                            )
                          )
                        )
                      )
                    : null
                )
              : null
          )
        : testCase.name
    ),
    h("td", { className: "duration" }, testCase.duration),
    h("td", { className: "status" }, testCase.status)
  )
}

function DeployReportDetails({ report }) {
  return h(ExpandableSection, { label: "Deploy" },
      h("dl", null,
        h("dt", null, "Deploy tool"),
        h("dd", null, report.deployTool, "\u00a0"),
        h("dt", null, "Targets"),
        h("dd", null, report.targets, "\u00a0")
      ),
      h("h2", null, "Tasks"),
      h("ul", { className: "tasks" },
        report.tasks.map((task, index) =>
          h("li", { key: `${task.name}-${index}` }, h(DeployTaskDetails, { report: task }))
        )
      )
  )
}

function DeployTaskDetails({ report }) {
  return h(ExpandableSection, { label: `Task ${report.name}` },
      report.commands.length
        ? h("ul", { className: "tasks" },
            report.commands.map((command, index) =>
              h("li", { key: `${command.command}-${index}` }, h(DeployCommandDetails, { report: command }))
            )
          )
        : null
  )
}

function DeployCommandDetails({ report }) {
  const servers = Object.keys(report.output).sort()
  const [selectedServer, setSelectedServer] = useState(servers[0])

  return h(ExpandableSection, { label: `Command ${report.command}` },
      servers.length
        ? h("div", { className: "tabs" },
            h("p", null,
              "Command output: ",
              servers.map((server) =>
                h(React.Fragment, { key: server },
                  h("a", {
                    href: "#",
                    onClick(event) {
                      event.preventDefault()
                      setSelectedServer(server)
                    },
                  }, server),
                  " "
                )
              )
            ),
            h("div", null,
              servers.map((server) =>
                h("pre", {
                  key: server,
                  style: { display: selectedServer === server ? undefined : "none" },
                }, report.output[server].map((line) => line.string).join("\n"))
              )
            )
          )
        : null
  )
}

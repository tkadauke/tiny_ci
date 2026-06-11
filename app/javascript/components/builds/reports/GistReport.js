import React, { useMemo } from "react"
import { parseReports } from "lib/reportParser"

const h = React.createElement

export function GistReport({ rows }) {
  const reports = useMemo(() => parseReports(rows), [rows])
  if (!reports.length) return null

  return h("ul", null,
    reports.map((report, index) =>
      h("li", { key: index }, h(ReportGist, { report }))
    )
  )
}

function ReportGist({ report }) {
  if (report.type === "build") {
    const testReports = report.tasks.filter((task) => task.type === "test")

    return h(React.Fragment, null,
      h("a", { href: "#" }, "Build"),
      h("div", null,
        h("dl", null,
          h("dt", null, "Build tool"),
          h("dd", null, report.buildTool),
          h("dt", null, "Targets"),
          h("dd", null, report.targets)
        ),
        h("h2", null, "Tasks"),
        h("ul", null,
          testReports.map((task, index) =>
            h("li", { key: `${task.name}-${index}` }, h(TestReportGist, { report: task }))
          )
        )
      )
    )
  }

  return h(DeployReportGist, { report })
}

function TestReportGist({ report }) {
  return h(React.Fragment, null,
    h("a", { href: "#" }, `Test Run ${report.name}`),
    h("div", null,
      h("dl", null,
        h("dt", null, "Total time"),
        h("dd", null, report.summary.totalTime),
        h("dt", null, "Tests"),
        h("dd", null, report.summary.tests),
        h("dt", null, "Assertions"),
        h("dd", null, report.summary.assertions),
        h("dt", null, "Failures"),
        h("dd", null, report.summary.failures),
        h("dt", null, "Errors"),
        h("dd", null, report.summary.errors)
      )
    )
  )
}

function DeployReportGist({ report }) {
  return h(React.Fragment, null,
    h("a", { href: "#" }, "Deploy"),
    h("div", null,
      h("dl", null,
        h("dt", null, "Deploy tool"),
        h("dd", null, report.deployTool, "\u00a0"),
        h("dt", null, "Targets"),
        h("dd", null, report.targets, "\u00a0")
      )
    )
  )
}

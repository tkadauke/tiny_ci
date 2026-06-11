import React, { useMemo } from "react"
import type { OutputRow } from "hooks/useBuild"
import { parseReports, type DeployReport, type Report, type TestReport } from "lib/reportParser"

type Props = {
  rows: OutputRow[]
}

export function GistReport({ rows }: Props) {
  const reports = useMemo(() => parseReports(rows), [rows])
  if (!reports.length) return null

  return (
    <ul>
      {reports.map((report, index) => (
        <li key={index}><ReportGist report={report} /></li>
      ))}
    </ul>
  )
}

function ReportGist({ report }: { report: Report }) {
  if (report.type === "build") {
    const testReports = report.tasks.filter((task): task is TestReport => task.type === "test")

    return (
      <>
        <a href="#">Build</a>
        <div>
          <dl>
            <dt>Build tool</dt>
            <dd>{report.buildTool}</dd>
            <dt>Targets</dt>
            <dd>{report.targets}</dd>
          </dl>

          <h2>Tasks</h2>
          <ul>
            {testReports.map((task, index) => (
              <li key={`${task.name}-${index}`}><TestReportGist report={task} /></li>
            ))}
          </ul>
        </div>
      </>
    )
  }

  return <DeployReportGist report={report} />
}

function TestReportGist({ report }: { report: TestReport }) {
  return (
    <>
      <a href="#">Test Run {report.name}</a>
      <div>
        <dl>
          <dt>Total time</dt>
          <dd>{report.summary.totalTime}</dd>
          <dt>Tests</dt>
          <dd>{report.summary.tests}</dd>
          <dt>Assertions</dt>
          <dd>{report.summary.assertions}</dd>
          <dt>Failures</dt>
          <dd>{report.summary.failures}</dd>
          <dt>Errors</dt>
          <dd>{report.summary.errors}</dd>
        </dl>
      </div>
    </>
  )
}

function DeployReportGist({ report }: { report: DeployReport }) {
  return (
    <>
      <a href="#">Deploy</a>
      <div>
        <dl>
          <dt>Deploy tool</dt>
          <dd>{report.deployTool}&nbsp;</dd>
          <dt>Targets</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>
      </div>
    </>
  )
}

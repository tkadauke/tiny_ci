import React, { useMemo } from "react"
import type { OutputRow } from "@/hooks/useBuild"
import { parseReports, type DeployReport, type Report, type TestReport } from "@/lib/reportParser"

type Props = {
  rows: OutputRow[]
}

export function GistReport({ rows }: Props) {
  const reports = useMemo(() => parseReports(rows), [rows])
  if (!reports.length) return null

  return (
    <ul className="space-y-3">
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
      <details open className="rounded-lg border border-gray-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"><a href="#" onClick={(event) => event.preventDefault()}>Build</a></summary>
        <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-700">
          <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <dt>Build tool</dt>
            <dd>{report.buildTool}</dd>
            <dt>Targets</dt>
            <dd>{report.targets}</dd>
          </dl>

          <h2 className="mb-2 text-base font-semibold text-gray-900">Tasks</h2>
          <ul className="space-y-3">
            {testReports.map((task, index) => (
              <li key={`${task.name}-${index}`}><TestReportGist report={task} /></li>
            ))}
          </ul>
        </div>
      </details>
    )
  }

  return <DeployReportGist report={report} />
}

function TestReportGist({ report }: { report: TestReport }) {
  return (
    <details open className="rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"><a href="#" onClick={(event) => event.preventDefault()}>Test Run {report.name}</a></summary>
      <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-700">
        <dl className="grid grid-cols-2 gap-3">
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
    </details>
  )
}

function DeployReportGist({ report }: { report: DeployReport }) {
  return (
    <details open className="rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"><a href="#" onClick={(event) => event.preventDefault()}>Deploy</a></summary>
      <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-700">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <dt>Deploy tool</dt>
          <dd>{report.deployTool}&nbsp;</dd>
          <dt>Targets</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>
      </div>
    </details>
  )
}

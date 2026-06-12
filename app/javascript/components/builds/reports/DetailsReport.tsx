import React, { useMemo, useState } from "react"
import type { OutputRow } from "@/hooks/useBuild"
import { parseReports, type DeployCommandReport, type DeployReport, type DeployTaskReport, type Report, type TestCase, type TestReport, type TaskReport } from "@/lib/reportParser"
import { RawOutput } from "./RawOutput"

type Props = {
  rows: OutputRow[]
}

export function DetailsReport({ rows }: Props) {
  const reports = useMemo(() => parseReports(rows), [rows])
  if (!reports.length) return null

  return (
    <ul className="space-y-3">
      {reports.map((report, index) => (
        <li key={index}><ReportDetails report={report} /></li>
      ))}
    </ul>
  )
}

function ReportDetails({ report }: { report: Report }) {
  if (report.type === "build") return <BuildReportDetails report={report} />
  return <DeployReportDetails report={report} />
}

function ExpandableSection({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <details open className="rounded-lg border border-gray-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50">
        <a href="#" onClick={(event) => event.preventDefault()}>
          {label}
        </a>
      </summary>
      <div className="border-t border-gray-100 px-4 py-4 text-sm text-gray-700">{children}</div>
    </details>
  )
}

function BuildReportDetails({ report }: { report: Extract<Report, { type: "build" }> }) {
  return (
    <ExpandableSection label="Build">
        <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <dt>Build tool</dt>
          <dd>{report.buildTool}&nbsp;</dd>
          <dt>Targets</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>

        <h2 className="mb-2 text-base font-semibold text-gray-900">Tasks</h2>
        <ul className="space-y-3">
          {report.tasks.map((task, index) => (
            <li key={`${task.name}-${index}`}><TaskDetails task={task} /></li>
          ))}
        </ul>
    </ExpandableSection>
  )
}

function TaskDetails({ task }: { task: TaskReport }) {
  if (task.type === "test") return <TestReportDetails report={task} />

  return (
    <ExpandableSection label={<>Task {task.name}</>}>
      {task.rawOutput.length ? <RawOutput rows={task.rawOutput} /> : null}
    </ExpandableSection>
  )
}

function TestReportDetails({ report }: { report: TestReport }) {
  const tests = [...report.tests].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <ExpandableSection label={<>Test Run {report.name}</>}>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Summary</h3>
        <TestSummaryList report={report} />

        <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-900">Details</h3>
        <ul className="space-y-3">
          {tests.map((test) => (
            <li key={test.name}>
              <ExpandableSection label={test.name}>
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Test Case</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {test.testCases.map((testCase, index) => (
                      <TestCaseRow key={`${testCase.name}-${index}`} testCase={testCase} />
                    ))}
                  </tbody>
                </table>
              </ExpandableSection>
            </li>
          ))}
        </ul>
    </ExpandableSection>
  )
}

function TestSummaryList({ report }: { report: TestReport }) {
  return (
    <dl className="grid grid-cols-2 gap-3">
      <dt>Total time</dt>
      <dd>{report.summary.totalTime}&nbsp;</dd>
      <dt>Tests</dt>
      <dd>{report.summary.tests}&nbsp;</dd>
      <dt>Assertions</dt>
      <dd>{report.summary.assertions}&nbsp;</dd>
      <dt>Failures</dt>
      <dd>{report.summary.failures}&nbsp;</dd>
      <dt>Errors</dt>
      <dd>{report.summary.errors}&nbsp;</dd>
    </dl>
  )
}

function TestCaseRow({ testCase }: { testCase: TestCase }) {
  const [expanded, setExpanded] = useState(false)
  const hasFailureDetails = testCase.status !== "success"

  return (
    <tr className={testCase.status === "success" ? "bg-white" : "bg-red-50"}>
      <td className="px-4 py-2 align-top">
        {hasFailureDetails ? (
          <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
            <summary className="cursor-pointer text-blue-600 hover:text-blue-500">
              <a href="#" onClick={(event) => { event.preventDefault(); setExpanded((current) => !current) }}>
                {testCase.name}
              </a>
            </summary>
            {expanded ? <div className="mt-2">
                {testCase.errorMessage ? <strong>{testCase.errorMessage}</strong> : null}
                {testCase.backtrace?.length ? (
                  <table className="mt-2 min-w-full text-xs">
                    <tbody>
                      {testCase.backtrace.map((invocation, index) => (
                        <tr key={index}>
                          <td>{invocation[0]}</td>
                          <td>{invocation[1]}</td>
                          <td>{invocation[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div> : null}
          </details>
        ) : testCase.name}
      </td>
      <td className="px-4 py-2 align-top">{testCase.duration}</td>
      <td className="px-4 py-2 align-top">{testCase.status}</td>
    </tr>
  )
}

function DeployReportDetails({ report }: { report: DeployReport }) {
  return (
    <ExpandableSection label="Deploy">
        <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <dt>Deploy tool</dt>
          <dd>{report.deployTool}&nbsp;</dd>
          <dt>Targets</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>

        <h2 className="mb-2 text-base font-semibold text-gray-900">Tasks</h2>
        <ul className="space-y-3">
          {report.tasks.map((task, index) => (
            <li key={`${task.name}-${index}`}><DeployTaskDetails report={task} /></li>
          ))}
        </ul>
    </ExpandableSection>
  )
}

function DeployTaskDetails({ report }: { report: DeployTaskReport }) {
  return (
    <ExpandableSection label={<>Task {report.name}</>}>
        {report.commands.length ? (
          <ul className="space-y-3">
            {report.commands.map((command, index) => (
              <li key={`${command.command}-${index}`}><DeployCommandDetails report={command} /></li>
            ))}
          </ul>
        ) : null}
    </ExpandableSection>
  )
}

function DeployCommandDetails({ report }: { report: DeployCommandReport }) {
  const servers = Object.keys(report.output).sort()
  const [selectedServer, setSelectedServer] = useState(servers[0])

  return (
    <ExpandableSection label={<>Command {report.command}</>}>
        {servers.length ? (
          <div>
            <p>
              Command output:{" "}
              {servers.map((server) => (
                <React.Fragment key={server}>
                  <a className="text-blue-600 hover:text-blue-500" href="#" onClick={(event) => { event.preventDefault(); setSelectedServer(server) }}>
                    {server}
                  </a>{" "}
                </React.Fragment>
              ))}
            </p>
            <div>
              {servers.map((server) => (
                <pre key={server} className="mt-3 overflow-x-auto rounded-lg bg-gray-950 p-4 font-mono text-xs text-gray-100" style={{ display: selectedServer === server ? undefined : "none" }}>
                  {report.output[server].map((line) => line.string).join("\n")}
                </pre>
              ))}
            </div>
          </div>
        ) : null}
    </ExpandableSection>
  )
}

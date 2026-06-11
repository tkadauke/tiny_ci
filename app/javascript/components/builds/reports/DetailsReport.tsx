import React, { useMemo, useState } from "react"
import type { OutputRow } from "hooks/useBuild"
import { parseReports, type DeployCommandReport, type DeployReport, type DeployTaskReport, type Report, type TestCase, type TestReport, type TaskReport } from "lib/reportParser"
import { RawOutput } from "./RawOutput"

type Props = {
  rows: OutputRow[]
}

export function DetailsReport({ rows }: Props) {
  const reports = useMemo(() => parseReports(rows), [rows])
  if (!reports.length) return null

  return (
    <ul>
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
  const [expanded, setExpanded] = useState(true)

  return (
    <>
      <a href="#" onClick={(event) => { event.preventDefault(); setExpanded((current) => !current) }}>
        {label}
      </a>
      <div style={{ display: expanded ? undefined : "none" }}>{children}</div>
    </>
  )
}

function BuildReportDetails({ report }: { report: Extract<Report, { type: "build" }> }) {
  return (
    <ExpandableSection label="Build">
        <dl>
          <dt>Build tool</dt>
          <dd>{report.buildTool}&nbsp;</dd>
          <dt>Targets</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>

        <h2>Tasks</h2>
        <ul className="tasks">
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
        <h3>Summary</h3>
        <TestSummaryList report={report} />

        <h3>Details</h3>
        <ul className="test-report">
          {tests.map((test) => (
            <li key={test.name}>
              <ExpandableSection label={test.name}>
                <table>
                  <thead>
                    <tr>
                      <th className="name">Test Case</th>
                      <th className="duration">Duration</th>
                      <th className="status">Status</th>
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
    <dl>
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
    <tr className={testCase.status}>
      <td className="name">
        {hasFailureDetails ? (
          <>
            <a href="#" onClick={(event) => { event.preventDefault(); setExpanded((current) => !current) }}>
              {testCase.name}
            </a>
            {expanded ? (
              <div>
                {testCase.errorMessage ? <strong>{testCase.errorMessage}</strong> : null}
                {testCase.backtrace?.length ? (
                  <table>
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
              </div>
            ) : null}
          </>
        ) : testCase.name}
      </td>
      <td className="duration">{testCase.duration}</td>
      <td className="status">{testCase.status}</td>
    </tr>
  )
}

function DeployReportDetails({ report }: { report: DeployReport }) {
  return (
    <ExpandableSection label="Deploy">
        <dl>
          <dt>Deploy tool</dt>
          <dd>{report.deployTool}&nbsp;</dd>
          <dt>Targets</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>

        <h2>Tasks</h2>
        <ul className="tasks">
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
          <ul className="tasks">
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
          <div className="tabs">
            <p>
              Command output:{" "}
              {servers.map((server) => (
                <React.Fragment key={server}>
                  <a href="#" onClick={(event) => { event.preventDefault(); setSelectedServer(server) }}>
                    {server}
                  </a>{" "}
                </React.Fragment>
              ))}
            </p>
            <div>
              {servers.map((server) => (
                <pre key={server} style={{ display: selectedServer === server ? undefined : "none" }}>
                  {report.output[server].map((line) => line.string).join("\n")}
                </pre>
              ))}
            </div>
          </div>
        ) : null}
    </ExpandableSection>
  )
}

import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { OutputRow } from "@/hooks/useBuild"
import { parseReports, type DeployReport, type Report, type TestReport } from "@/lib/reportParser"

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
  const { t } = useTranslation()

  if (report.type === "build") {
    const testReports = report.tasks.filter((task): task is TestReport => task.type === "test")

    return (
      <>
        <a href="#">{t("report.build")}</a>
        <div>
          <dl>
            <dt>{t("report.build_tool")}</dt>
            <dd>{report.buildTool}</dd>
            <dt>{t("report.targets")}</dt>
            <dd>{report.targets}</dd>
          </dl>

          <h2>{t("report.tasks")}</h2>
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
  const { t } = useTranslation()

  return (
    <>
      <a href="#">{t("report.test_run", { name: report.name })}</a>
      <div>
        <dl>
          <dt>{t("report.total_time")}</dt>
          <dd>{report.summary.totalTime}</dd>
          <dt>{t("report.tests")}</dt>
          <dd>{report.summary.tests}</dd>
          <dt>{t("report.assertions")}</dt>
          <dd>{report.summary.assertions}</dd>
          <dt>{t("report.failures")}</dt>
          <dd>{report.summary.failures}</dd>
          <dt>{t("report.errors")}</dt>
          <dd>{report.summary.errors}</dd>
        </dl>
      </div>
    </>
  )
}

function DeployReportGist({ report }: { report: DeployReport }) {
  const { t } = useTranslation()

  return (
    <>
      <a href="#">{t("report.deploy")}</a>
      <div>
        <dl>
          <dt>{t("report.deploy_tool")}</dt>
          <dd>{report.deployTool}&nbsp;</dd>
          <dt>{t("report.targets")}</dt>
          <dd>{report.targets}&nbsp;</dd>
        </dl>
      </div>
    </>
  )
}

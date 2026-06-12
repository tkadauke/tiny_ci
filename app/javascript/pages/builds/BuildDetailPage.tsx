import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { DetailsReport } from "@/components/builds/reports/DetailsReport"
import { GistReport } from "@/components/builds/reports/GistReport"
import { RawOutput } from "@/components/builds/reports/RawOutput"
import { StatusBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { api } from "@/lib/api"
import { useBuild, type OutputRow } from "@/hooks/useBuild"
import { useChannel } from "@/hooks/useChannel"

const FINISHED_STATUSES = new Set(["success", "error", "failure", "canceled", "stopped"])

type Props = {
  projectId: string
  planId: string
  buildId: string
}

function iconPath(size: "small" | "large", status: string) {
  return `/assets/icons/${size}/${status}.png`
}

function duration(seconds: number | null, t: (key: string) => string) {
  if (seconds == null) return ""

  let remaining = Math.floor(seconds)
  const parts = [
    [Math.floor(remaining / 86400), t("duration.days")],
    [Math.floor((remaining %= 86400) / 3600), t("duration.hours")],
    [Math.floor((remaining %= 3600) / 60), t("duration.minutes")],
    [remaining % 60, t("duration.seconds")],
  ] as const

  return parts.filter(([value]) => value !== 0).map(([value, label]) => `${value} ${label}`).join(", ")
}

function normalizeReportMode(value: string | null) {
  return value === "gist" || value === "details" ? value : "raw"
}

function useReportMode() {
  const [mode, setMode] = useState(() => normalizeReportMode(new URLSearchParams(window.location.search).get("report")))

  useEffect(() => {
    const onPopState = () => setMode(normalizeReportMode(new URLSearchParams(window.location.search).get("report")))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const updateMode = useCallback((nextMode: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set("report", nextMode)
    window.history.pushState({}, "", `${window.location.pathname}?${params}`)
    setMode(nextMode)
  }, [])

  return [mode, updateMode] as const
}

function ReportBody({ mode, rows }: { mode: string; rows: OutputRow[] }) {
  const { t } = useTranslation()
  if (mode === "gist") return rows.length ? <GistReport rows={rows} /> : <p>{t("builds.report.no_output_yet")}</p>
  if (mode === "details") return rows.length ? <DetailsReport rows={rows} /> : <p>{t("builds.report.no_output_yet")}</p>
  return <RawOutput rows={rows} />
}

export function BuildDetailPage({ projectId, planId, buildId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: build, error, isLoading } = useBuild(projectId, planId, buildId)
  const [stopping, setStopping] = useState(false)
  const [mode, setMode] = useReportMode()
  const queryKey = useMemo(() => ["build", projectId, planId, buildId], [projectId, planId, buildId])

  useChannel(
    build ? "BuildChannel" : null,
    build ? { build_name: build.name, build_position: build.position } : null,
    useCallback(() => queryClient.invalidateQueries({ queryKey }), [queryClient, queryKey])
  )

  if (isLoading) return <p>{t("spa.builds.loading_build")}</p>
  if (error || !build) return <p>{t("spa.builds.load_build_error")}</p>

  const planPath = `/projects/${encodeURIComponent(build.plan.project_id)}/plans/${encodeURIComponent(build.plan.plan_id)}`
  const showStop = build.status === "pending" || build.status === "running"

  return (
    <>
      <h1>
        {t("spa.builds.build_output_of")} <a href={planPath}>{build.plan.name}</a> #{build.position}
        {build.worker ? ` on worker ${build.worker.name}` : ""}
      </h1>
      <dl>
        <dt>{t("builds.build.status")}</dt>
        <dd><StatusBadge status={build.status} label={t(`build.status.${build.status}`, { defaultValue: build.status_text || build.status })} /></dd>
        <dt>{t("builds.build.revision")}</dt>
        <dd>{build.revision || t("builds.build.unknown")}</dd>
        <dt>{t("builds.build.duration")}</dt>
        <dd>{duration(build.duration, t)}&nbsp;</dd>
        {build.starter_login ? (
          <>
            <dt>{t("builds.build.started_by")}</dt>
            <dd><a href={`/users/${encodeURIComponent(build.starter_login)}`}>{build.starter_login}</a> {t("builds.build.requested_manually")}</dd>
          </>
        ) : null}
      </dl>
      {showStop ? (
        <p>
          <Button
            type="button"
            variant="ghost"
            disabled={stopping}
            onClick={async () => {
              setStopping(true)
              await api.post(`/api/projects/${encodeURIComponent(projectId)}/plans/${encodeURIComponent(planId)}/builds/${encodeURIComponent(buildId)}/stop`, {})
            }}
          >
            <img src={iconPath("small", "stopped")} alt="" /> {t("spa.actions.stop")}
          </Button>
        </p>
      ) : null}
      <ul className="action-list">
        {(["raw", "gist", "details"] as const).map((nextMode) => (
          <li key={nextMode}>
            <a href={`?report=${nextMode}`} aria-current={mode === nextMode ? "page" : undefined} onClick={(event) => { event.preventDefault(); setMode(nextMode) }}>
              {nextMode === "raw" ? t("builds.build.raw_output") : t(`builds.build.${nextMode}`)}
            </a>
          </li>
        ))}
      </ul>
      <div className="report" id="report"><ReportBody mode={mode} rows={build.output_rows} /></div>
      {FINISHED_STATUSES.has(build.status) ? (
        <p><StatusBadge status={build.status} label={t(`build.status.${build.status}`, { defaultValue: build.status_text || build.status })} /></p>
      ) : null}
      {build.status === "running" ? <img src="/assets/spinner.gif" alt={t("build.status.running")} /> : null}
    </>
  )
}

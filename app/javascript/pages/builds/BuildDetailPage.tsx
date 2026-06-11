import React, { useCallback, useEffect, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { api } from "@/lib/api"
import { useBuild, type OutputRow } from "@/hooks/useBuild"
import { useChannel } from "@/hooks/useChannel"

const FINISHED_STATUSES = new Set(["success", "error", "failure", "canceled", "stopped"])
const STATUS_TEXT: Record<string, string> = {
  canceled: "Canceled",
  error: "Error",
  failure: "Failure",
  pending: "Pending",
  running: "Running",
  stopped: "Stopped",
  stopping: "Stopping",
  success: "Success",
  waiting: "Waiting",
}

type Props = {
  projectId: string
  planId: string
  buildId: string
}

function statusText(status: string) {
  return STATUS_TEXT[status] || status
}

function iconPath(size: "small" | "large", status: string) {
  return `/assets/icons/${size}/${status}.png`
}

function duration(seconds: number | null) {
  if (seconds == null) return ""

  let remaining = Math.floor(seconds)
  const parts = [
    [Math.floor(remaining / 86400), "days"],
    [Math.floor((remaining %= 86400) / 3600), "hours"],
    [Math.floor((remaining %= 3600) / 60), "minutes"],
    [remaining % 60, "seconds"],
  ] as const

  return parts.filter(([value]) => value !== 0).map(([value, label]) => `${value} ${label}`).join(", ")
}

function timeText(timestamp: number) {
  return new Date(Number(timestamp) * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
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

function RawOutput({ rows }: { rows: OutputRow[] }) {
  let lastCommand: string | undefined
  let lastTimestamp: number | undefined

  return (
    <div className="raw-output">
      <table>
        <tbody>
          {rows.map((row) => {
            const timestamp = Math.trunc(Number(row.timestamp))
            const showTimestamp = timestamp !== lastTimestamp
            const showCommand = row.command !== lastCommand
            lastTimestamp = timestamp
            lastCommand = row.command

            return (
              <tr key={row.index}>
                <td className="row">{row.index}</td>
                <td className="timestamp">{showTimestamp ? timeText(row.timestamp) : ""}</td>
                <td className="command">{showCommand ? row.command : ""}</td>
                <td className="line">{row.line}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReportBody({ mode, rows }: { mode: string; rows: OutputRow[] }) {
  if (!rows.length) return <p>No output (yet)</p>
  if (mode === "gist") return <p>Gist report placeholder</p>
  if (mode === "details") return <p>Details report placeholder</p>
  return <RawOutput rows={rows} />
}

export function BuildDetailPage({ projectId, planId, buildId }: Props) {
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

  if (isLoading) return <p>Loading build...</p>
  if (error || !build) return <p>Could not load build.</p>

  const planPath = `/projects/${encodeURIComponent(build.plan.project_id)}/plans/${encodeURIComponent(build.plan.plan_id)}`
  const showStop = build.status === "pending" || build.status === "running"

  return (
    <>
      <h1>
        Build output of <a href={planPath}>{build.plan.name}</a> #{build.position}
        {build.slave ? ` on slave ${build.slave.name}` : ""}
      </h1>
      <dl>
        <dt>Status</dt>
        <dd><img src={iconPath("large", build.status)} alt="" /> {build.status_text || statusText(build.status)}</dd>
        <dt>Revision</dt>
        <dd>{build.revision || "unknown"}</dd>
        <dt>Duration</dt>
        <dd>{duration(build.duration)}&nbsp;</dd>
        {build.starter_login ? (
          <>
            <dt>Started by</dt>
            <dd><a href={`/users/${build.starter_id}`}>{build.starter_login}</a> (Requested manually)</dd>
          </>
        ) : null}
      </dl>
      {showStop ? (
        <p>
          <button
            className="stop-link"
            disabled={stopping}
            onClick={async () => {
              setStopping(true)
              await api.post(`/api/projects/${encodeURIComponent(projectId)}/plans/${encodeURIComponent(planId)}/builds/${encodeURIComponent(buildId)}/stop`, {})
            }}
          >
            <img src={iconPath("small", "stopped")} alt="" /> Stop
          </button>
        </p>
      ) : null}
      <ul className="action-list">
        {(["raw", "gist", "details"] as const).map((nextMode) => (
          <li key={nextMode}>
            <a href={`?report=${nextMode}`} aria-current={mode === nextMode ? "page" : undefined} onClick={(event) => { event.preventDefault(); setMode(nextMode) }}>
              {nextMode === "raw" ? "Raw output" : nextMode[0].toUpperCase() + nextMode.slice(1)}
            </a>
          </li>
        ))}
      </ul>
      <div className="report" id="report"><ReportBody mode={mode} rows={build.output_rows} /></div>
      {FINISHED_STATUSES.has(build.status) ? <p><img src={iconPath("small", build.status)} alt="" /> {build.status_text || statusText(build.status)}</p> : null}
      {build.status === "running" ? <img src="/assets/spinner.gif" alt="Running" /> : null}
    </>
  )
}

export const buildDetailQueryClient = new QueryClient()

export function BuildDetailPageProvider(props: Props) {
  return (
    <QueryClientProvider client={buildDetailQueryClient}>
      <BuildDetailPage {...props} />
    </QueryClientProvider>
  )
}

export function mountBuildDetailPage(element: HTMLElement) {
  createRoot(element).render(
    <BuildDetailPageProvider
      projectId={element.dataset.projectId || ""}
      planId={element.dataset.planId || ""}
      buildId={element.dataset.buildId || ""}
    />
  )
}

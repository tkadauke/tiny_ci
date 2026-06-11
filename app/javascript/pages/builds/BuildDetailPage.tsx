import React, { useCallback, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { fetchJson } from "lib/api"
import { useBuild, type OutputRow } from "hooks/useBuild"
import { useChannel } from "hooks/useChannel"
import { RawOutput } from "components/builds/reports/RawOutput"
import { DetailsReport } from "components/builds/reports/DetailsReport"
import { GistReport } from "components/builds/reports/GistReport"

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

function ReportBody({ mode, rows }: { mode: string; rows: OutputRow[] }) {
  if (mode === "gist") return rows.length ? <GistReport rows={rows} /> : <p>No output (yet)</p>
  if (mode === "details") return rows.length ? <DetailsReport rows={rows} /> : <p>No output (yet)</p>
  return <RawOutput rows={rows} />
}

export function BuildDetailPage({ projectId, planId, buildId }: Props) {
  const queryClient = useQueryClient()
  const { data: build, error, isLoading } = useBuild(projectId, planId, buildId)
  const [stopping, setStopping] = useState(false)
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get("report") || "raw")
  const queryKey = useMemo(() => ["build", projectId, planId, buildId], [projectId, planId, buildId])

  useChannel(
    build ? { channel: "BuildChannel", build_name: build.name, build_position: build.position } : null,
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
        <dd>{build.duration || ""}&nbsp;</dd>
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
              await fetchJson(`/api/projects/${projectId}/plans/${planId}/builds/${buildId}/stop`, { method: "POST", body: JSON.stringify({}) })
            }}
          >
            <img src={iconPath("small", "stopped")} alt="" /> Stop
          </button>
        </p>
      ) : null}
      <ul className="action-list">
        {(["raw", "gist", "details"] as const).map((nextMode) => (
          <li key={nextMode}>
            <a href={`?report=${nextMode}`} onClick={(event) => { event.preventDefault(); setMode(nextMode) }}>
              {nextMode === "raw" ? "Raw output" : nextMode[0].toUpperCase() + nextMode.slice(1)}
            </a>
          </li>
        ))}
      </ul>
      <div className="report" id="report"><ReportBody mode={mode} rows={build.output_rows} /></div>
      {FINISHED_STATUSES.has(build.status) ? <p><img src={iconPath("small", build.status)} alt="" /> {build.status_text || statusText(build.status)}</p> : null}
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

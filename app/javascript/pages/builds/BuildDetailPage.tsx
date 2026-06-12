import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { DetailsReport } from "@/components/builds/reports/DetailsReport"
import { GistReport } from "@/components/builds/reports/GistReport"
import { RawOutput } from "@/components/builds/reports/RawOutput"
import { StatusBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card, CardBody, CardHeader } from "@/components/ui/Card"
import { TabBar } from "@/components/ui/TabBar"
import { api } from "@/lib/api"
import { useBuild, type OutputRow } from "@/hooks/useBuild"
import { useChannel } from "@/hooks/useChannel"

const FINISHED_STATUSES = new Set(["success", "error", "failure", "canceled", "stopped"])

type Props = {
  projectId: string
  planId: string
  buildId: string
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
  if (mode === "gist") return rows.length ? <GistReport rows={rows} /> : <p>No output (yet)</p>
  if (mode === "details") return rows.length ? <DetailsReport rows={rows} /> : <p>No output (yet)</p>
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
        {build.worker ? ` on worker ${build.worker.name}` : ""}
      </h1>
      <Card className="mb-6">
        <CardHeader>Metadata</CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1"><StatusBadge status={build.status} /></dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Revision</dt>
              <dd className="mt-1 break-all font-mono text-xs text-gray-900">{build.revision || "unknown"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm text-gray-900">{duration(build.duration)}&nbsp;</dd>
            </div>
            {build.starter_login ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">Started by</dt>
                <dd className="mt-1 text-sm text-gray-900"><a href={`/users/${encodeURIComponent(build.starter_login)}`}>{build.starter_login}</a> (Requested manually)</dd>
              </div>
            ) : null}
          </dl>
        </CardBody>
      </Card>
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
            Stop
          </Button>
        </p>
      ) : null}
      <TabBar
        activeKey={mode}
        onSelect={setMode}
        items={[
          { key: "raw", label: "Raw", href: "?report=raw" },
          { key: "gist", label: "Gist", href: "?report=gist" },
          { key: "details", label: "Details", href: "?report=details" },
        ]}
      />
      <div><ReportBody mode={mode} rows={build.output_rows} /></div>
      {FINISHED_STATUSES.has(build.status) ? <p><StatusBadge status={build.status} /></p> : null}
      {build.status === "running" ? (
        <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-700" role="status" aria-label="Running">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" />
          Running
        </div>
      ) : null}
    </>
  )
}

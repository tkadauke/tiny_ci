import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { fetchJson } from "lib/api"
import { useBuild } from "hooks/useBuild"
import { useChannel } from "hooks/useChannel"
import { RawOutput } from "components/builds/reports/RawOutput"
import { DetailsReport } from "components/builds/reports/DetailsReport"
import { GistReport } from "components/builds/reports/GistReport"

const h = React.createElement
const FINISHED_STATUSES = new Set(["success", "error", "failure", "canceled", "stopped"])
const STATUS_TEXT = {
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

let root
let rootElement
const queryClient = new QueryClient()

function statusText(status) {
  return STATUS_TEXT[status] || status
}

function iconPath(size, status) {
  return `/assets/icons/${size}/${status}.png`
}

function duration(seconds) {
  if (seconds == null) return ""

  let remaining = Math.floor(seconds)
  const parts = [
    [Math.floor(remaining / 86400), "days"],
    [Math.floor((remaining %= 86400) / 3600), "hours"],
    [Math.floor((remaining %= 3600) / 60), "minutes"],
    [remaining % 60, "seconds"],
  ]

  return parts.filter(([value]) => value !== 0).map(([value, label]) => `${value} ${label}`).join(", ")
}

function normalizeReportMode(value) {
  return ["raw", "gist", "details"].includes(value) ? value : "raw"
}

function useReportMode() {
  const [mode, setMode] = useState(() => normalizeReportMode(new URLSearchParams(window.location.search).get("report")))

  useEffect(() => {
    const onPopState = () => setMode(normalizeReportMode(new URLSearchParams(window.location.search).get("report")))
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const updateMode = useCallback((nextMode) => {
    const params = new URLSearchParams(window.location.search)
    params.set("report", nextMode)
    window.history.pushState({}, "", `${window.location.pathname}?${params}`)
    setMode(nextMode)
  }, [])

  return [mode, updateMode]
}

function ReportBody({ mode, rows }) {
  if (mode === "gist") return rows.length ? h(GistReport, { rows }) : h("p", null, "No output (yet)")
  if (mode === "details") return rows.length ? h(DetailsReport, { rows }) : h("p", null, "No output (yet)")
  return h(RawOutput, { rows })
}

function ReportToggle({ mode, onModeChange }) {
  return h("ul", { className: "action-list" },
    [
      ["raw", "Raw output"],
      ["gist", "Gist"],
      ["details", "Details"],
    ].map(([value, label]) =>
      h("li", { key: value },
        h("a", {
          href: `?report=${value}`,
          "aria-current": mode === value ? "page" : undefined,
          onClick(event) {
            event.preventDefault()
            onModeChange(value)
          },
        }, label)
      )
    )
  )
}

function StopButton({ projectId, planId, buildId }) {
  const [stopping, setStopping] = useState(false)

  return h("p", null,
    h("button", {
      className: "stop-link",
      type: "button",
      disabled: stopping,
      onClick: async () => {
        setStopping(true)
        await fetchJson(`/api/projects/${encodeURIComponent(projectId)}/plans/${encodeURIComponent(planId)}/builds/${encodeURIComponent(buildId)}/stop`, {
          method: "POST",
          body: JSON.stringify({}),
        })
      },
    },
      h("img", { src: iconPath("small", "stopped"), alt: "" }),
      " Stop"
    )
  )
}

function BuildDetail({ projectId, planId, buildId }) {
  const queryClient = useQueryClient()
  const { data: build, error, isLoading } = useBuild(projectId, planId, buildId)
  const [mode, setMode] = useReportMode()
  const queryKey = useMemo(() => ["build", projectId, planId, buildId], [projectId, planId, buildId])

  useChannel(
    build ? { channel: "BuildChannel", build_name: build.name, build_position: build.position } : null,
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey })
    }, [queryClient, queryKey])
  )

  if (isLoading) return h("p", null, "Loading build...")
  if (error) return h("p", null, "Could not load build.")

  const rows = build.output_rows || []
  const planPath = `/projects/${encodeURIComponent(build.plan.project_id)}/plans/${encodeURIComponent(build.plan.plan_id)}`
  const showStop = build.status === "pending" || build.status === "running"
  const finished = FINISHED_STATUSES.has(build.status)
  const currentStatusText = build.status_text || statusText(build.status)

  return h(React.Fragment, null,
    h("h1", null,
      "Build output of ",
      h("a", { href: planPath }, build.plan.name),
      ` #${build.position}`,
      build.slave ? ` on slave ${build.slave.name}` : ""
    ),
    h("dl", null,
      h("dt", null, "Status"),
      h("dd", null, h("img", { src: iconPath("large", build.status), alt: "" }), " ", currentStatusText),
      h("dt", null, "Revision"),
      h("dd", null, build.revision || "unknown"),
      h("dt", null, "Duration"),
      h("dd", null, duration(build.duration), "\u00a0"),
      build.starter_login ? [
        h("dt", { key: "starter-label" }, "Started by"),
        h("dd", { key: "starter-value" },
          h("a", { href: `/users/${build.starter_id}` }, build.starter_login),
          " (Requested manually)"
        ),
      ] : null
    ),
    showStop ? h(StopButton, { projectId, planId, buildId }) : null,
    h(ReportToggle, { mode, onModeChange: setMode }),
    h("div", { className: "report", id: "report" }, h(ReportBody, { mode, rows })),
    finished
      ? h("p", null, h("img", { src: iconPath("small", build.status), alt: "" }), " ", currentStatusText)
      : build.status === "running"
        ? h("img", { src: "/assets/spinner.gif", alt: "Running" })
        : null
  )
}

export function startBuildDetailPage() {
  const element = document.querySelector("[data-react-page='build-detail']")
  if (!element) {
    root = undefined
    rootElement = undefined
    return
  }

  if (!root || rootElement !== element) {
    root = createRoot(element)
    rootElement = element
  }

  root.render(
    h(QueryClientProvider, { client: queryClient },
      h(BuildDetail, {
        projectId: element.dataset.projectId,
        planId: element.dataset.planId,
        buildId: element.dataset.buildId,
      })
    )
  )
}

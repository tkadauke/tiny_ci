import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { buildsQueryKey } from "hooks/useBuilds"

const FINISHED_STATUSES = new Set(["success", "error", "failure", "canceled", "stopped"])

const STATUS_LABELS = {
  canceled: "Canceled",
  error: "Error",
  failure: "Failure",
  pending: "Pending",
  running: "Running",
  stopped: "Stopped",
  stopping: "Stopping",
  success: "Success",
  waiting: "Waiting"
}

function pathForBuild(build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}/builds/${build.position}`
}

function pathForPlan(build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}`
}

function pathForProject(build) {
  return `/projects/${build.plan.project_id}`
}

function formatTimestamp(value) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const parts = [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear()
  ]
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ]

  return `${parts.join("/")} ${time.join(":")}`
}

function csrfToken() {
  return document.querySelector("meta[name='csrf-token']")?.content
}

async function stopBuild(build) {
  const headers = { Accept: "application/json" }
  const token = csrfToken()
  if (token) headers["X-CSRF-Token"] = token

  const response = await fetch(`${pathForBuild(build)}/stop`.replace("/projects/", "/api/projects/"), {
    method: "POST",
    headers,
    credentials: "same-origin"
  })

  if (!response.ok) {
    throw new Error(`Stop failed with status ${response.status}`)
  }
}

function StatusCell({ build }) {
  const label = STATUS_LABELS[build.status] || build.status

  return React.createElement(
    "td",
    null,
    React.createElement("img", {
      src: build.status_icon_path,
      alt: "",
      width: 16,
      height: 16
    }),
    " ",
    label
  )
}

function StopCell({ build, projectId, planId, stopIconPath }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => stopBuild(build),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildsQueryKey(projectId, planId) })
    }
  })

  if (FINISHED_STATUSES.has(build.status)) {
    return React.createElement("td", null)
  }

  return React.createElement(
    "td",
    null,
    React.createElement(
      "button",
      {
        type: "button",
        className: "stop-link",
        disabled: mutation.isPending || build.status === "stopping",
        onClick: () => mutation.mutate()
      },
      React.createElement("img", {
        src: stopIconPath,
        alt: "",
        width: 16,
        height: 16
      }),
      " Stop"
    )
  )
}

function BuildRow({ build, child, projectId, planId, stopIconPath }) {
  return React.createElement(
    "tr",
    null,
    React.createElement(
      "td",
      null,
      child ? "+ " : null,
      React.createElement("a", { href: pathForBuild(build) }, build.position)
    ),
    React.createElement(
      "td",
      null,
      React.createElement("a", { href: pathForProject(build) }, build.plan.project_name),
      " / ",
      React.createElement("a", { href: pathForPlan(build) }, build.plan.name)
    ),
    React.createElement(
      "td",
      null,
      React.createElement("a", { href: pathForBuild(build) }, formatTimestamp(build.created_at))
    ),
    React.createElement(StatusCell, { build }),
    React.createElement(StopCell, { build, projectId, planId, stopIconPath })
  )
}

export function BuildList({ builds, projectId, planId, stopIconPath, emptyMessage = "No builds" }) {
  if (!builds || builds.length === 0) {
    return React.createElement("p", null, emptyMessage)
  }

  const rows = []
  builds.forEach((build) => {
    rows.push(React.createElement(BuildRow, { key: build.id, build, projectId, planId, stopIconPath }))
    build.children?.forEach((child) => {
      rows.push(React.createElement(BuildRow, {
        key: `child-${child.id}`,
        build: child,
        child: true,
        projectId,
        planId,
        stopIconPath
      }))
    })
  })

  return React.createElement(
    "table",
    { className: "list" },
    React.createElement(
      "thead",
      null,
      React.createElement(
        "tr",
        null,
        React.createElement("th", null, "Number"),
        React.createElement("th", null, "Name"),
        React.createElement("th", null, "Timestamp"),
        React.createElement("th", null, "Status"),
        React.createElement("th", null)
      )
    ),
    React.createElement("tbody", null, rows)
  )
}

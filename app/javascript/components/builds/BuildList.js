import React from "react"
import { BuildStatusIcon } from "components/builds/BuildStatusIcon"
import { statusIconPath } from "lib/assets"
import { csrfToken } from "lib/csrf"
import { h } from "lib/h"

const UNFINISHED_STATUSES = ["pending", "running", "waiting", "stopping"]

function buildPath(build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}/builds/${build.position}`
}

function planPath(build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}`
}

function projectPath(build) {
  return `/projects/${build.plan.project_id}`
}

function stopPath(build) {
  return `/api/projects/${build.plan.project_id}/plans/${build.plan.plan_id}/builds/${build.position}/stop`
}

function formatTimestamp(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatDuration(value) {
  if (value == null) return ""
  let duration = Math.floor(Number(value))
  if (!duration) return ""

  const seconds = duration % 60
  duration = Math.floor(duration / 60)
  const minutes = duration % 60
  duration = Math.floor(duration / 60)
  const hours = duration % 24
  const days = Math.floor(duration / 24)

  return [
    [days, "days"],
    [hours, "hours"],
    [minutes, "minutes"],
    [seconds, "seconds"],
  ]
    .filter(([amount]) => amount !== 0)
    .map(([amount, label]) => `${amount} ${label}`)
    .join(", ")
}

function StopButton({ build, onStopped }) {
  const [stopping, setStopping] = React.useState(build.status === "stopping")
  const disabled = stopping || build.status === "stopping"

  function stopBuild(event) {
    event.preventDefault()
    setStopping(true)

    fetch(stopPath(build), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": csrfToken() || "",
      },
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Stop failed with ${response.status}`)
        onStopped(build.id)
      })
      .catch(() => setStopping(false))
  }

  return h(
    "button",
    { type: "button", className: "stop-link", disabled, onClick: stopBuild },
    h("img", { src: statusIconPath("stopped"), alt: "" }),
    " Stop"
  )
}

function BuildRow({ build, child = false, showDuration, showStopAction, onStopped }) {
  const unfinished = UNFINISHED_STATUSES.includes(build.status)

  return h(
    "tr",
    null,
    h("td", null, child ? "+ " : "", h("a", { href: buildPath(build) }, build.position)),
    h(
      "td",
      null,
      h("a", { href: projectPath(build) }, build.plan.project_name),
      " / ",
      h("a", { href: planPath(build) }, build.plan.name)
    ),
    h("td", null, h("a", { href: buildPath(build) }, formatTimestamp(build.created_at))),
    h("td", null, h(BuildStatusIcon, { status: build.status })),
    showDuration ? h("td", null, formatDuration(build.duration)) : null,
    showStopAction
      ? h("td", null, unfinished ? h(StopButton, { build, onStopped }) : null)
      : null
  )
}

export function BuildList({ builds = [], showDuration = false, showStopAction = true }) {
  const [stoppingBuildIds, setStoppingBuildIds] = React.useState([])

  if (builds.length === 0) return h("p", null, "No builds")

  function markStopping(buildId) {
    setStoppingBuildIds((ids) => [...new Set([...ids, buildId])])
  }

  const rows = builds.flatMap((build) => {
    const parentBuild = stoppingBuildIds.includes(build.id) ? { ...build, status: "stopping" } : build
    const parentRow = h(BuildRow, {
      key: `build-${build.id}`,
      build: parentBuild,
      showDuration,
      showStopAction,
      onStopped: markStopping,
    })
    const childRows = (build.children || []).map((child) => {
      const childBuild = stoppingBuildIds.includes(child.id) ? { ...child, status: "stopping" } : child
      return h(BuildRow, {
        key: `build-${build.id}-child-${child.id}`,
        build: childBuild,
        child: true,
        showDuration,
        showStopAction,
        onStopped: markStopping,
      })
    })

    return [parentRow, ...childRows]
  })

  return h(
    "table",
    { className: "list" },
    h(
      "thead",
      null,
      h(
        "tr",
        null,
        h("th", null, "Number"),
        h("th", null, "Name"),
        h("th", null, "Timestamp"),
        h("th", null, "Status"),
        showDuration ? h("th", null, "Duration") : null,
        showStopAction ? h("th", null) : null
      )
    ),
    h("tbody", null, rows)
  )
}

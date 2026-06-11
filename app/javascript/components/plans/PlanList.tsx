import React from "react"
import { WeatherIcon } from "@/components/plans/WeatherIcon"

const h = React.createElement

function statusIcon(status, size) {
  if (!status) return null

  return h("img", {
    src: `/assets/icons/${size}/${status}.png`,
    alt: status,
    title: status
  })
}

function truncate(text, length) {
  if (!text) return ""
  return text.length > length ? `${text.slice(0, length - 3)}...` : text
}

function duration(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") return "unknown"

  let remaining = Number(seconds)
  if (!Number.isFinite(remaining)) return "unknown"

  const days = Math.floor(remaining / 86400)
  remaining %= 86400
  const hours = Math.floor(remaining / 3600)
  remaining %= 3600
  const minutes = Math.floor(remaining / 60)
  const secs = Math.floor(remaining % 60)
  const parts = [
    [days, "days"],
    [hours, "hours"],
    [minutes, "minutes"],
    [secs, "seconds"]
  ].filter(([value]) => value !== 0)

  return parts.length ? parts.map(([value, unit]) => `${value} ${unit}`).join(", ") : "0 seconds"
}

function timeAgo(value) {
  if (!value) return "unknown"

  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return "unknown"

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000))
  const units = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"]
  ]

  for (const [unitSeconds, label] of units) {
    if (seconds >= unitSeconds) {
      const count = Math.floor(seconds / unitSeconds)
      return `${count} ${label}${count === 1 ? "" : "s"} ago`
    }
  }

  return "less than a minute ago"
}

function planPath(plan) {
  return `/projects/${encodeURIComponent(plan.project.name)}/plans/${encodeURIComponent(plan.name)}`
}

function projectPath(plan) {
  return `/projects/${encodeURIComponent(plan.project.name)}`
}

function planName(plan) {
  return h(
    React.Fragment,
    null,
    h("a", { href: projectPath(plan) }, plan.project.name),
    " / ",
    h("a", { href: planPath(plan) }, plan.name)
  )
}

function listRows(plans) {
  return plans.map((plan) =>
    h(
      "tr",
      { key: `${plan.project.name}/${plan.name}` },
      h("td", null, statusIcon(plan.status, "small")),
      h("td", null, h(WeatherIcon, { weather: plan.weather })),
      h("td", null, planName(plan)),
      h("td", null, truncate(plan.description, 40)),
      h("td", null, duration(plan.last_build_time)),
      h("td", null, plan.last_success_at ? timeAgo(plan.last_success_at) : "unknown"),
      h("td", null, plan.last_failure_at ? timeAgo(plan.last_failure_at) : "unknown")
    )
  )
}

function PlanTable({ plans }) {
  return h(
    "table",
    { className: "list" },
    h(
      "thead",
      null,
      h(
        "tr",
        null,
        h("th", null),
        h("th", null),
        h("th", null, "Name"),
        h("th", null, "Description"),
        h("th", null, "Last Build time"),
        h("th", null, "Last Success"),
        h("th", null, "Last Failure")
      )
    ),
    h("tbody", null, listRows(plans))
  )
}

function PlanOverview({ plans }) {
  return h(
    React.Fragment,
    null,
    h(
      "ul",
      { className: "plan-overview" },
      plans.map((plan) =>
        h(
          "li",
          { key: `${plan.project.name}/${plan.name}` },
          h("div", { className: "status" }, statusIcon(plan.status, "large")),
          h(
            "div",
            { className: "details" },
            h("a", { href: planPath(plan) }, plan.name),
            h("br"),
            h("span", { className: "secondary" }, "(", h("a", { href: projectPath(plan) }, plan.project.name), ")")
          )
        )
      )
    ),
    h("div", { className: "clearer" })
  )
}

export function PlanList({ plans, mode }) {
  return mode === "overview" ? h(PlanOverview, { plans }) : h(PlanTable, { plans })
}

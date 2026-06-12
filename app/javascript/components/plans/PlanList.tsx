import React from "react"
import { WeatherIcon } from "@/components/plans/WeatherIcon"
import { StatusBadge } from "@/components/ui/Badge"
import { Table, Td, Th, Tr } from "@/components/ui/Table"

const h = React.createElement

type Reference = {
  name: string
}

export type PlanListPlan = {
  id?: number
  name: string
  description?: string | null
  status?: string | null
  weather?: number | string | null
  project: Reference
  last_build_time?: number | string | null
  last_success_at?: string | null
  last_failure_at?: string | null
}

function statusBadge(status: string | null | undefined) {
  if (!status) return null

  return h(StatusBadge, { status })
}

function truncate(text: string | null | undefined, length: number) {
  if (!text) return ""
  return text.length > length ? `${text.slice(0, length - 3)}...` : text
}

function duration(seconds: number | string | null | undefined) {
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
  ].filter(([value]) => value !== 0) as Array<[number, string]>

  return parts.length ? parts.map(([value, unit]) => `${value} ${unit}`).join(", ") : "0 seconds"
}

function timeAgo(value: string | null | undefined) {
  if (!value) return "unknown"

  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return "unknown"

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000))
  const units: Array<[number, string]> = [
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

function planPath(plan: PlanListPlan) {
  return `/projects/${encodeURIComponent(plan.project.name)}/plans/${encodeURIComponent(plan.name)}`
}

function projectPath(plan: PlanListPlan) {
  return `/projects/${encodeURIComponent(plan.project.name)}`
}

function planName(plan: PlanListPlan) {
  return h(
    React.Fragment,
    null,
    h("a", { href: projectPath(plan) }, plan.project.name),
    " / ",
    h("a", { href: planPath(plan) }, plan.name)
  )
}

function listRows(plans: PlanListPlan[]) {
  return plans.map((plan) =>
    h(
      Tr,
      { key: `${plan.project.name}/${plan.name}` },
      h(Td, null, statusBadge(plan.status)),
      h(Td, null, h(WeatherIcon, { weather: plan.weather })),
      h(Td, null, planName(plan)),
      h(Td, null, truncate(plan.description, 40)),
      h(Td, null, duration(plan.last_build_time)),
      h(Td, null, plan.last_success_at ? timeAgo(plan.last_success_at) : "unknown"),
      h(Td, null, plan.last_failure_at ? timeAgo(plan.last_failure_at) : "unknown")
    )
  )
}

function PlanTable({ plans }: { plans: PlanListPlan[] }) {
  return h(
    Table,
    null,
    h(
      "thead",
      null,
      h(
        "tr",
        null,
        h(Th, null),
        h(Th, null),
        h(Th, null, "Name"),
        h(Th, null, "Description"),
        h(Th, null, "Last Build time"),
        h(Th, null, "Last Success"),
        h(Th, null, "Last Failure")
      )
    ),
    h("tbody", null, listRows(plans))
  )
}

function PlanOverview({ plans }: { plans: PlanListPlan[] }) {
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
          h("div", { className: "status" }, statusBadge(plan.status)),
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

export function PlanList({ plans, mode }: { plans: PlanListPlan[]; mode: "list" | "overview" }) {
  if (plans.length === 0) return h("p", null, "No plans")

  return mode === "overview" ? h(PlanOverview, { plans }) : h(PlanTable, { plans })
}

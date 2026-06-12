import React from "react"
import { useTranslation } from "react-i18next"
import { WeatherIcon } from "@/components/plans/WeatherIcon"

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

function statusIcon(status: string | null | undefined, size: "small" | "large", title?: string) {
  if (!status) return null

  return h("img", {
    src: `/assets/icons/${size}/${status}.png`,
    alt: title ?? status,
    title: title ?? status
  })
}

function truncate(text: string | null | undefined, length: number) {
  if (!text) return ""
  return text.length > length ? `${text.slice(0, length - 3)}...` : text
}

function duration(seconds: number | string | null | undefined, t: (key: string) => string) {
  if (seconds === null || seconds === undefined || seconds === "") return t("plans.list.unknown")

  let remaining = Number(seconds)
  if (!Number.isFinite(remaining)) return t("plans.list.unknown")

  const days = Math.floor(remaining / 86400)
  remaining %= 86400
  const hours = Math.floor(remaining / 3600)
  remaining %= 3600
  const minutes = Math.floor(remaining / 60)
  const secs = Math.floor(remaining % 60)
  const parts = [
    [days, t("duration.days")],
    [hours, t("duration.hours")],
    [minutes, t("duration.minutes")],
    [secs, t("duration.seconds")]
  ].filter(([value]) => value !== 0) as Array<[number, string]>

  return parts.length ? parts.map(([value, unit]) => `${value} ${unit}`).join(", ") : `0 ${t("duration.seconds")}`
}

function timeAgo(value: string | null | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  if (!value) return t("plans.list.unknown")

  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return t("plans.list.unknown")

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
      return t("plans.list.time_ago", { time: `${count} ${label}${count === 1 ? "" : "s"}` })
    }
  }

  return t("plans.list.time_ago", { time: t("spa.time.less_than_minute") })
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

function listRows(plans: PlanListPlan[], t: (key: string, options?: Record<string, unknown>) => string) {
  return plans.map((plan) =>
    h(
      "tr",
      { key: `${plan.project.name}/${plan.name}` },
      h("td", null, statusIcon(plan.status, "small", plan.status ? t(`build.status.${plan.status}`, { defaultValue: plan.status }) : undefined)),
      h("td", null, h(WeatherIcon, { weather: plan.weather })),
      h("td", null, planName(plan)),
      h("td", null, truncate(plan.description, 40)),
      h("td", null, duration(plan.last_build_time, t)),
      h("td", null, plan.last_success_at ? timeAgo(plan.last_success_at, t) : t("plans.list.unknown")),
      h("td", null, plan.last_failure_at ? timeAgo(plan.last_failure_at, t) : t("plans.list.unknown"))
    )
  )
}

function PlanTable({ plans }: { plans: PlanListPlan[] }) {
  const { t } = useTranslation()

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
        h("th", null, t("plans.list.name")),
        h("th", null, t("plans.list.description")),
        h("th", null, t("plans.list.last_build_time")),
        h("th", null, t("plans.list.last_success")),
        h("th", null, t("plans.list.last_failure"))
      )
    ),
    h("tbody", null, listRows(plans, t))
  )
}

function PlanOverview({ plans }: { plans: PlanListPlan[] }) {
  const { t } = useTranslation()

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
          h("div", { className: "status" }, statusIcon(plan.status, "large", plan.status ? t(`build.status.${plan.status}`, { defaultValue: plan.status }) : undefined)),
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
  const { t } = useTranslation()

  if (plans.length === 0) return h("p", null, t("spa.plans.no_plans"))

  return mode === "overview" ? h(PlanOverview, { plans }) : h(PlanTable, { plans })
}

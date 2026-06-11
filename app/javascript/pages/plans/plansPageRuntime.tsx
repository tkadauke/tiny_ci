import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import { PlanList, type PlanListPlan } from "@/components/plans/PlanList"

const h = React.createElement
type ReportMode = "list" | "overview"

type PlansPageProps = {
  heading: string
  endpoint: string
  basePath: string
  canCreatePlans?: boolean
  newPlanPath?: string | null
}

function isReportMode(value: string | null): value is ReportMode {
  return value === "list" || value === "overview"
}

function modeFromLocation(): ReportMode {
  const report = new URLSearchParams(window.location.search).get("report")
  return isReportMode(report) ? report : "list"
}

function preserveScroll(callback: () => void) {
  const scrollX = window.scrollX
  const scrollY = window.scrollY
  callback()
  requestAnimationFrame(() => window.scrollTo(scrollX, scrollY))
}

function usePlans(endpoint: string) {
  const [plans, setPlans] = useState<PlanListPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refresh = useCallback(() => {
    return fetch(endpoint, {
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with ${response.status}`)
        return response.json()
      })
      .then((data) => {
        preserveScroll(() => {
          setPlans(data)
          setError(null)
          setLoading(false)
        })
      })
      .catch((fetchError) => {
        setError(fetchError)
        setLoading(false)
      })
  }, [endpoint])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const interval = window.setInterval(refresh, 15000)
    const onStreamRender = (event: Event) => {
      const stream = event.target as Element | null
      if (stream?.getAttribute("action") === "refresh") refresh()
    }

    document.addEventListener("turbo:before-stream-render", onStreamRender)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("turbo:before-stream-render", onStreamRender)
    }
  }, [refresh])

  return { plans, loading, error, refresh }
}

function ModeToggle({ mode, basePath }: { mode: ReportMode; basePath: string }) {
  return h(
    "ul",
    { className: "action-list" },
    h("li", null, h("a", { href: `${basePath}?report=list`, "aria-current": mode === "list" ? "page" : undefined }, "Details")),
    h("li", null, h("a", { href: `${basePath}?report=overview`, "aria-current": mode === "overview" ? "page" : undefined }, "Overview"))
  )
}

export function PlansPage({ heading, endpoint, basePath, canCreatePlans = false, newPlanPath = null }: PlansPageProps) {
  const [mode, setMode] = useState(modeFromLocation)
  const { plans, loading, error } = usePlans(endpoint)

  useEffect(() => {
    const onPopState = () => setMode(modeFromLocation())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null
      if (!link || link.origin !== window.location.origin || link.pathname !== basePath) return

      const report = new URL(link.href).searchParams.get("report")
      if (!isReportMode(report)) return

      event.preventDefault()
      window.history.pushState({}, "", link.href)
      setMode(report)
    }

    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [basePath])

  const content = useMemo(() => {
    if (loading) return h("p", null, "Loading...")
    if (error) return h("p", { className: "error" }, "Could not load plans.")
    return h(PlanList, { plans, mode })
  }, [error, loading, mode, plans])

  return h(
    React.Fragment,
    null,
    h("h1", null, heading),
    h(ModeToggle, { mode, basePath }),
    h("div", { id: "plans" }, content),
    canCreatePlans && newPlanPath ? h("p", null, h("a", { href: newPlanPath }, "New Plan")) : null
  )
}

export function mountPlansPage(element: HTMLElement, props: PlansPageProps) {
  if (element.dataset.reactMounted === "true") return
  element.dataset.reactMounted = "true"

  createRoot(element).render(h(PlansPage, props))
}

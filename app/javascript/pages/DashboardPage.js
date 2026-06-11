import React from "react"
import { BuildQueueWidget } from "components/dashboard/BuildQueueWidget"
import { QuickLinks } from "components/dashboard/QuickLinks"
import { RecentBuildsWidget } from "components/dashboard/RecentBuildsWidget"
import { SlaveStatusWidget } from "components/dashboard/SlaveStatusWidget"
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query"
import { useChannel } from "lib/useChannel"
import { h } from "lib/h"

const dashboardQueryKey = ["dashboard"]
const dashboardClient = new QueryClient()

async function fetchDashboard() {
  const response = await fetch("/api/dashboard", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })

  if (!response.ok) throw new Error(`Dashboard failed with ${response.status}`)
  return response.json()
}

function DashboardContent({ currentUser }) {
  const queryClient = useQueryClient()
  const onQueueMessage = React.useCallback(() => {
    queryClient.invalidateQueries(dashboardQueryKey)
  }, [queryClient])
  const { data, error, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboard,
    enabled: currentUser.loggedIn,
    initialData: { queue: [], slaves: [], recent_builds: [] },
  })

  useChannel({ channel: "QueueChannel" }, onQueueMessage)

  return h(
    React.Fragment,
    null,
    h(QuickLinks, { currentUser }),
    error ? h("p", null, "Dashboard data could not be loaded.") : null,
    isLoading ? h("p", null, "Loading...") : null,
    h(
      "div",
      { id: "queue" },
      h(BuildQueueWidget, { builds: data?.queue || [] }),
      h(SlaveStatusWidget, { slaves: data?.slaves || [] }),
      h(RecentBuildsWidget, { builds: data?.recent_builds || [] })
    )
  )
}

export function DashboardPage({ currentUser }) {
  return h(
    QueryClientProvider,
    { client: dashboardClient },
    h(DashboardContent, { currentUser })
  )
}

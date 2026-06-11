import React, { useCallback } from "react"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { BuildList } from "components/BuildList"
import { RequireAuth } from "components/RequireAuth"
import { buildsQueryKey, useBuilds } from "hooks/useBuilds"
import { useChannel } from "hooks/useChannel"

const queryClient = new QueryClient()

function BuildHistoryContent({ projectId, planId, planName, stopIconPath }) {
  const buildsQuery = useBuilds(projectId, planId)
  const queryClient = useQueryClient()
  const planPath = `/projects/${projectId}/plans/${planId}`
  const invalidateBuilds = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: buildsQueryKey(projectId, planId) })
  }, [queryClient, projectId, planId])

  useChannel("QueueChannel", {}, { received: invalidateBuilds })

  return React.createElement(
    RequireAuth,
    null,
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "h1",
        null,
        "Builds of Plan ",
        React.createElement("a", { href: planPath }, planName)
      ),
      buildsQuery.isLoading
        ? React.createElement("p", null, "Loading...")
        : buildsQuery.isError
          ? React.createElement("p", null, "Unable to load builds")
          : React.createElement(BuildList, {
              builds: buildsQuery.data,
              projectId,
              planId,
              stopIconPath,
              emptyMessage: "No builds"
            }),
      React.createElement("p", null, React.createElement("a", { href: planPath }, "Back to Plan"))
    )
  )
}

export function BuildHistoryPage(props) {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BuildHistoryContent, props)
  )
}

export function mountBuildHistoryPage(element) {
  createRoot(element).render(
    React.createElement(BuildHistoryPage, {
      projectId: element.dataset.projectId,
      planId: element.dataset.planId,
      planName: element.dataset.planName,
      stopIconPath: element.dataset.stopIconPath
    })
  )
}

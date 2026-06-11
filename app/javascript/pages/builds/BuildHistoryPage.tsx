import React, { useCallback } from "react"
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { BuildList } from "@/components/BuildList"
import { RequireAuth } from "@/components/RequireAuth"
import { buildsQueryKey, useBuilds } from "@/hooks/useBuilds"
import { useChannel } from "@/hooks/useChannel"

type BuildHistoryPageProps = {
  projectId: string
  planId: string
  planName: string
  stopIconPath?: string
}

const queryClient = new QueryClient()

export function BuildHistoryPage({ projectId, planId, planName, stopIconPath }: BuildHistoryPageProps) {
  const buildsQuery = useBuilds(projectId, planId)
  const queryClient = useQueryClient()
  const planPath = `/projects/${projectId}/plans/${planId}`
  const invalidateBuilds = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: buildsQueryKey(projectId, planId) })
  }, [queryClient, projectId, planId])

  useChannel("QueueChannel", {}, invalidateBuilds)

  return (
    <RequireAuth>
      <h1>
        Builds of Plan <a href={planPath}>{planName}</a>
      </h1>
      {buildsQuery.isLoading ? (
        <p>Loading...</p>
      ) : buildsQuery.isError ? (
        <p>Unable to load builds</p>
      ) : (
        <BuildList
          builds={buildsQuery.data}
          projectId={projectId}
          planId={planId}
          stopIconPath={stopIconPath}
          emptyMessage="No builds"
        />
      )}
      <p>
        <a href={planPath}>Back to Plan</a>
      </p>
    </RequireAuth>
  )
}

export function mountBuildHistoryPage(element: HTMLElement) {
  createRoot(element).render(
    <QueryClientProvider client={queryClient}>
      <BuildHistoryPage
        projectId={element.dataset.projectId || ""}
        planId={element.dataset.planId || ""}
        planName={element.dataset.planName || ""}
        stopIconPath={element.dataset.stopIconPath}
      />
    </QueryClientProvider>
  )
}

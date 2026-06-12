import React, { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BuildList } from "@/components/BuildList"
import { Card, CardBody } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { RequireAuth } from "@/components/RequireAuth"
import { buildsQueryKey, useBuilds } from "@/hooks/useBuilds"
import { useChannel } from "@/hooks/useChannel"

type BuildHistoryPageProps = {
  projectId: string
  planId: string
  planName: string
  stopIconPath?: string
}

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
      <PageHeader title={<>Builds of Plan <a href={planPath}>{planName}</a></>} />
      {buildsQuery.isLoading ? (
        <p>Loading...</p>
      ) : buildsQuery.isError ? (
        <p>Unable to load builds</p>
      ) : (
        <Card>
          <CardBody>
            <BuildList
              builds={buildsQuery.data}
              projectId={projectId}
              planId={planId}
              stopIconPath={stopIconPath}
              emptyMessage="No builds"
            />
          </CardBody>
        </Card>
      )}
      <p>
        <a href={planPath}>Back to Plan</a>
      </p>
    </RequireAuth>
  )
}

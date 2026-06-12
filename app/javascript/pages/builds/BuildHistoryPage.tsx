import React, { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
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

export function BuildHistoryPage({ projectId, planId, planName, stopIconPath }: BuildHistoryPageProps) {
  const { t } = useTranslation()
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
        {t("spa.builds.builds_of_plan")} <a href={planPath}>{planName}</a>
      </h1>
      {buildsQuery.isLoading ? (
        <p>{t("spa.loading")}</p>
      ) : buildsQuery.isError ? (
        <p>{t("spa.builds.load_error")}</p>
      ) : (
        <BuildList
          builds={buildsQuery.data}
          projectId={projectId}
          planId={planId}
          stopIconPath={stopIconPath}
          emptyMessage={t("builds.list.no_builds")}
        />
      )}
      <p>
        <a href={planPath}>{t("builds.index.back_to_plan")}</a>
      </p>
    </RequireAuth>
  )
}

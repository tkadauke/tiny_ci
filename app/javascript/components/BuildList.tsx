import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import type { Build } from "@/hooks/useBuilds"
import { buildsQueryKey } from "@/hooks/useBuilds"

type BuildListProps = {
  builds: Build[] | undefined
  projectId: string
  planId: string
  stopIconPath?: string
  emptyMessage?: string
}

const FINISHED_STATUSES = new Set(["success", "error", "failure", "canceled", "stopped"])

function pathForBuild(build: Build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}/builds/${build.position}`
}

function pathForPlan(build: Build) {
  return `/projects/${build.plan.project_id}/plans/${build.plan.plan_id}`
}

function pathForProject(build: Build) {
  return `/projects/${build.plan.project_id}`
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const parts = [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear()
  ]
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ]

  return `${parts.join("/")} ${time.join(":")}`
}

function csrfToken() {
  return document.querySelector<HTMLMetaElement>("meta[name='csrf-token']")?.content
}

async function stopBuild(build: Build) {
  const headers: Record<string, string> = { Accept: "application/json" }
  const token = csrfToken()
  if (token) headers["X-CSRF-Token"] = token

  const response = await fetch(`${pathForBuild(build)}/stop`.replace("/projects/", "/api/projects/"), {
    method: "POST",
    headers,
    credentials: "same-origin"
  })

  if (!response.ok) {
    throw new Error(`Stop failed with status ${response.status}`)
  }
}

function StatusCell({ build }: { build: Build }) {
  const { t } = useTranslation()
  const label = t(`build.status.${build.status}`, { defaultValue: build.status })

  return (
    <td>
      <img src={build.status_icon_path} alt="" width={16} height={16} /> {label}
    </td>
  )
}

function StopCell({
  build,
  projectId,
  planId,
  stopIconPath
}: {
  build: Build
  projectId: string
  planId: string
  stopIconPath?: string
}) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const mutation = useMutation({
    mutationFn: () => stopBuild(build),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildsQueryKey(projectId, planId) })
    }
  })

  if (FINISHED_STATUSES.has(build.status)) {
    return <td />
  }

  return (
    <td>
      <button
        type="button"
        className="stop-link"
        disabled={mutation.isPending || build.status === "stopping"}
        onClick={() => mutation.mutate()}
      >
        <img src={stopIconPath} alt="" width={16} height={16} /> {t("spa.actions.stop")}
      </button>
    </td>
  )
}

function BuildRow({
  build,
  child,
  projectId,
  planId,
  stopIconPath
}: {
  build: Build
  child?: boolean
  projectId: string
  planId: string
  stopIconPath?: string
}) {
  return (
    <tr>
      <td>
        {child ? "+ " : null}
        <a href={pathForBuild(build)}>{build.position}</a>
      </td>
      <td>
        <a href={pathForProject(build)}>{build.plan.project_name}</a> /{" "}
        <a href={pathForPlan(build)}>{build.plan.name}</a>
      </td>
      <td>
        <a href={pathForBuild(build)}>{formatTimestamp(build.created_at)}</a>
      </td>
      <StatusCell build={build} />
      <StopCell build={build} projectId={projectId} planId={planId} stopIconPath={stopIconPath} />
    </tr>
  )
}

export function BuildList({
  builds,
  projectId,
  planId,
  stopIconPath,
  emptyMessage
}: BuildListProps) {
  const { t } = useTranslation()

  if (!builds || builds.length === 0) {
    return <p>{emptyMessage ?? t("builds.list.no_builds")}</p>
  }

  return (
    <table className="list">
      <thead>
        <tr>
          <th>{t("builds.list.number")}</th>
          <th>{t("builds.list.name")}</th>
          <th>{t("builds.list.timestamp")}</th>
          <th>{t("builds.list.status")}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {builds.flatMap((build) => [
          <BuildRow
            key={build.id}
            build={build}
            projectId={projectId}
            planId={planId}
            stopIconPath={stopIconPath}
          />,
          ...(build.children || []).map((child) => (
            <BuildRow
              key={`child-${child.id}`}
              build={child}
              child
              projectId={projectId}
              planId={planId}
              stopIconPath={stopIconPath}
            />
          ))
        ])}
      </tbody>
    </table>
  )
}

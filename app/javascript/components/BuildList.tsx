import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { StatusBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, Td, Th, Tr } from "@/components/ui/Table"
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
  return (
    <Td>
      <StatusBadge status={build.status} />
    </Td>
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
  const mutation = useMutation({
    mutationFn: () => stopBuild(build),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buildsQueryKey(projectId, planId) })
    }
  })

  if (FINISHED_STATUSES.has(build.status)) {
    return <Td />
  }

  return (
    <Td>
      <Button
        type="button"
        variant="ghost"
        disabled={mutation.isPending || build.status === "stopping"}
        onClick={() => mutation.mutate()}
      >
        <img src={stopIconPath} alt="" width={16} height={16} /> Stop
      </Button>
    </Td>
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
    <Tr>
      <Td>
        {child ? "+ " : null}
        <a href={pathForBuild(build)}>{build.position}</a>
      </Td>
      <Td>
        <a href={pathForProject(build)}>{build.plan.project_name}</a> /{" "}
        <a href={pathForPlan(build)}>{build.plan.name}</a>
      </Td>
      <Td>
        <a href={pathForBuild(build)}>{formatTimestamp(build.created_at)}</a>
      </Td>
      <StatusCell build={build} />
      <StopCell build={build} projectId={projectId} planId={planId} stopIconPath={stopIconPath} />
    </Tr>
  )
}

export function BuildList({
  builds,
  projectId,
  planId,
  stopIconPath,
  emptyMessage = "No builds"
}: BuildListProps) {
  if (!builds || builds.length === 0) {
    return <p>{emptyMessage}</p>
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Number</Th>
          <Th>Name</Th>
          <Th>Timestamp</Th>
          <Th>Status</Th>
          <Th />
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
    </Table>
  )
}

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export type OutputRow = {
  index: number
  timestamp: number
  command: string
  line: string
}

export type BuildDetail = {
  id: number
  name: string
  position: number
  status: string
  status_text: string
  duration: number | null
  revision: string | null
  worker: { name: string } | null
  starter_id: number | null
  starter_login: string | null
  plan: {
    name: string
    project_name: string
    project_id: string
    plan_id: string
  }
  output_rows: OutputRow[]
}

export function buildPath(projectId: string, planId: string, buildId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/plans/${encodeURIComponent(planId)}/builds/${encodeURIComponent(buildId)}`
}

function shareOutputRows(oldRows: OutputRow[] = [], newRows: OutputRow[] = []) {
  return newRows.map((row, index) => {
    const oldRow = oldRows[index]
    return oldRow &&
      oldRow.index === row.index &&
      oldRow.timestamp === row.timestamp &&
      oldRow.command === row.command &&
      oldRow.line === row.line
      ? oldRow
      : row
  })
}

function isBuildDetail(value: unknown): value is BuildDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "plan" in value &&
    "output_rows" in value &&
    Array.isArray((value as { output_rows?: unknown }).output_rows)
  )
}

export function shareBuild(oldBuild: unknown, newBuild: unknown) {
  if (!isBuildDetail(newBuild)) return newBuild
  if (!isBuildDetail(oldBuild)) return newBuild

  return {
    ...newBuild,
    plan:
      oldBuild.plan.name === newBuild.plan.name &&
      oldBuild.plan.project_name === newBuild.plan.project_name &&
      oldBuild.plan.project_id === newBuild.plan.project_id &&
      oldBuild.plan.plan_id === newBuild.plan.plan_id
        ? oldBuild.plan
        : newBuild.plan,
    worker: oldBuild.worker?.name === newBuild.worker?.name ? oldBuild.worker : newBuild.worker,
    output_rows: shareOutputRows(oldBuild.output_rows, newBuild.output_rows),
  }
}

export function useBuild(projectId: string, planId: string, buildId: string) {
  return useQuery<BuildDetail>({
    queryKey: ["build", projectId, planId, buildId],
    queryFn: () => api.get<BuildDetail>(buildPath(projectId, planId, buildId)),
    structuralSharing: shareBuild,
  })
}

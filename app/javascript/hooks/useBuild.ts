import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "lib/api"

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
  slave: { name: string } | null
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

export function shareBuild(oldBuild: BuildDetail | undefined, newBuild: BuildDetail) {
  if (!oldBuild) return newBuild

  return {
    ...newBuild,
    plan:
      oldBuild.plan.name === newBuild.plan.name &&
      oldBuild.plan.project_name === newBuild.plan.project_name &&
      oldBuild.plan.project_id === newBuild.plan.project_id &&
      oldBuild.plan.plan_id === newBuild.plan.plan_id
        ? oldBuild.plan
        : newBuild.plan,
    slave: oldBuild.slave?.name === newBuild.slave?.name ? oldBuild.slave : newBuild.slave,
    output_rows: shareOutputRows(oldBuild.output_rows, newBuild.output_rows),
  }
}

export function useBuild(projectId: string, planId: string, buildId: string) {
  return useQuery({
    queryKey: ["build", projectId, planId, buildId],
    queryFn: () => fetchJson(buildPath(projectId, planId, buildId)) as Promise<BuildDetail>,
    structuralSharing: shareBuild,
  })
}

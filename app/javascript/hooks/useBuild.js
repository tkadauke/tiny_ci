import { useQuery } from "@tanstack/react-query"
import { fetchJson } from "lib/api"

export function buildPath(projectId, planId, buildId) {
  return `/api/projects/${encodeURIComponent(projectId)}/plans/${encodeURIComponent(planId)}/builds/${encodeURIComponent(buildId)}`
}

function shareOutputRows(oldRows = [], newRows = []) {
  return newRows.map((row, index) => {
    const oldRow = oldRows[index]
    if (
      oldRow &&
      oldRow.index === row.index &&
      oldRow.timestamp === row.timestamp &&
      oldRow.command === row.command &&
      oldRow.line === row.line
    ) {
      return oldRow
    }
    return row
  })
}

export function shareBuild(oldBuild, newBuild) {
  if (!oldBuild || !newBuild) return newBuild

  return {
    ...newBuild,
    plan:
      oldBuild.plan &&
      oldBuild.plan.name === newBuild.plan?.name &&
      oldBuild.plan.project_name === newBuild.plan?.project_name &&
      oldBuild.plan.project_id === newBuild.plan?.project_id &&
      oldBuild.plan.plan_id === newBuild.plan?.plan_id
        ? oldBuild.plan
        : newBuild.plan,
    slave:
      oldBuild.slave?.name === newBuild.slave?.name
        ? oldBuild.slave
        : newBuild.slave,
    output_rows: shareOutputRows(oldBuild.output_rows, newBuild.output_rows),
  }
}

export function useBuild(projectId, planId, buildId) {
  return useQuery({
    queryKey: ["build", projectId, planId, buildId],
    queryFn: () => fetchJson(buildPath(projectId, planId, buildId)),
    structuralSharing: shareBuild,
  })
}

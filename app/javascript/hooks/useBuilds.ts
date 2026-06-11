import { useQuery } from "@tanstack/react-query"

export type BuildPlan = {
  name: string
  project_name: string
  project_id: string
  plan_id: string
}

export type Build = {
  id: number
  position: number
  status: string
  status_icon_path: string
  created_at: string
  finished_at: string | null
  duration: number | null
  starter_login: string | null
  plan: BuildPlan
  has_children: boolean
  children: Build[]
}

export function buildsQueryKey(projectId: string, planId: string) {
  return ["builds", projectId, planId] as const
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "same-origin"
  })

  if (response.redirected) {
    window.location.assign(response.url)
    return undefined as T
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export function useBuilds(projectId: string, planId: string) {
  return useQuery({
    queryKey: buildsQueryKey(projectId, planId),
    queryFn: () => fetchJson<Build[]>(`/api/projects/${projectId}/plans/${planId}/builds`)
  })
}

import { useQuery } from "@tanstack/react-query"

export function buildsQueryKey(projectId, planId) {
  return ["builds", projectId, planId]
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "same-origin"
  })

  if (response.redirected) {
    window.location.assign(response.url)
    return
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export function useBuilds(projectId, planId) {
  return useQuery({
    queryKey: buildsQueryKey(projectId, planId),
    queryFn: () => fetchJson(`/api/projects/${projectId}/plans/${planId}/builds`)
  })
}

function normalizeErrors(data) {
  return Array.isArray(data?.errors) ? data.errors : ["Unable to save project"]
}

export function useUpdateProject() {
  async function updateProject(projectId, project) {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project })
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return { ok: false, errors: normalizeErrors(data) }
    }

    return { ok: true, project: data }
  }

  return { updateProject }
}

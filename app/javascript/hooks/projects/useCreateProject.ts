function normalizeErrors(data) {
  return Array.isArray(data?.errors) ? data.errors : ["Unable to save project"]
}

export function useCreateProject() {
  async function createProject(project) {
    const response = await fetch("/api/projects", {
      method: "POST",
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

  return { createProject }
}

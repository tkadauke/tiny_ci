import type { Project } from "@/hooks/projects/useProjects"
import type { ProjectAttributes } from "@/hooks/projects/useCreateProject"

type SaveProjectResult = { ok: true; project: Project } | { ok: false; errors: string[] }

function normalizeErrors(data: unknown): string[] {
  if (
    typeof data === "object" &&
    data !== null &&
    "errors" in data &&
    Array.isArray((data as { errors?: unknown }).errors)
  ) {
    return (data as { errors: unknown[] }).errors.map(String)
  }

  return ["Unable to save project"]
}

export function useUpdateProject() {
  async function updateProject(projectId: string, project: ProjectAttributes): Promise<SaveProjectResult> {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ project })
    })
    const data: unknown = await response.json().catch(() => ({}))

    if (!response.ok) {
      return { ok: false, errors: normalizeErrors(data) }
    }

    return { ok: true, project: data as Project }
  }

  return { updateProject }
}

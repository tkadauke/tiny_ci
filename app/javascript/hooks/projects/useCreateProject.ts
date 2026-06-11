import type { Project } from "@/hooks/projects/useProjects"

export type ProjectAttributes = {
  name: string
  description: string
}

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

export function useCreateProject() {
  async function createProject(project: ProjectAttributes): Promise<SaveProjectResult> {
    const response = await fetch("/api/projects", {
      method: "POST",
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

  return { createProject }
}

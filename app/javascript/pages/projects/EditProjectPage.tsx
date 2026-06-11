import { createElement as h, useState } from "react"
import { useUpdateProject } from "@/hooks/projects/useUpdateProject"
import { ProjectForm, showFlash } from "@/pages/projects/NewProjectPage"
import type { ProjectAttributes } from "@/hooks/projects/useCreateProject"
import type { Project } from "@/hooks/projects/useProjects"

type TurboWindow = Window & {
  Turbo?: {
    visit: (location: string) => void
  }
}

function navigateToProjects() {
  const turbo = (window as TurboWindow).Turbo
  if (turbo) {
    turbo.visit("/projects")
  } else {
    window.location.href = "/projects"
  }
}

export default function EditProjectPage({ project }: { project: Project }) {
  const [errors, setErrors] = useState<string[]>([])
  const { updateProject } = useUpdateProject()

  async function handleSubmit(attributes: ProjectAttributes) {
    const result = await updateProject(project.name, attributes)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    showFlash("Successfully updated project")
    navigateToProjects()
  }

  return h(
    "div",
    null,
    h("h1", null, `Edit Project ${project.name}`),
    h(ProjectForm, { project, submitLabel: "Update", onSubmit: handleSubmit, errors })
  )
}

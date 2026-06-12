import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { useUpdateProject } from "hooks/projects/useUpdateProject"
import { ProjectForm, showFlash } from "pages/projects/NewProjectPage"
import type { Project } from "hooks/projects/useProjects"

export default function EditProjectPage({ project }: { project: Project }) {
  const [errors, setErrors] = useState<string[]>([])
  const { updateProject } = useUpdateProject()

  async function handleSubmit(attributes: Partial<Project>) {
    const result = await updateProject(project.name, attributes)
    if (!result.ok) {
      setErrors(result.errors ?? [])
      return
    }

    showFlash("Successfully updated project")
    if (window.Turbo) {
      window.Turbo.visit("/projects")
    } else {
      window.location.href = "/projects"
    }
  }

  return (
    <>
      <PageHeader title={`Edit Project ${project.name}`} />
      <ProjectForm project={project} submitLabel="Save" onSubmit={handleSubmit} errors={errors} />
    </>
  )
}

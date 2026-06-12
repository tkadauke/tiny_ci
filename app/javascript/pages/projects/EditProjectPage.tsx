import { createElement as h, useState } from "react"
import { useTranslation } from "react-i18next"
import { useUpdateProject } from "hooks/projects/useUpdateProject"
import { ProjectForm, showFlash } from "pages/projects/NewProjectPage"
import type { Project } from "hooks/projects/useProjects"

export default function EditProjectPage({ project }: { project: Project }) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<string[]>([])
  const { updateProject } = useUpdateProject()

  async function handleSubmit(attributes: Partial<Project>) {
    const result = await updateProject(project.name, attributes)
    if (!result.ok) {
      setErrors(result.errors ?? [])
      return
    }

    showFlash(t("flash.notice.updated_project"))
    if (window.Turbo) {
      window.Turbo.visit("/projects")
    } else {
      window.location.href = "/projects"
    }
  }

  return h(
    "div",
    null,
    h("h1", null, t("projects.edit.edit_project_name", { name: project.name })),
    h(ProjectForm, { project, submitLabel: t("projects.edit.update"), onSubmit: handleSubmit, errors })
  )
}

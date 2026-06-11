import { createElement as h, useState } from "react"
import { useUpdateProject } from "hooks/projects/useUpdateProject"
import { ProjectForm, showFlash } from "pages/projects/NewProjectPage"

export default function EditProjectPage({ project }) {
  const [errors, setErrors] = useState([])
  const { updateProject } = useUpdateProject()

  async function handleSubmit(attributes) {
    const result = await updateProject(project.name, attributes)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    showFlash("Successfully updated project")
    if (window.Turbo) {
      window.Turbo.visit("/projects")
    } else {
      window.location.href = "/projects"
    }
  }

  return h(
    "div",
    null,
    h("h1", null, `Edit Project ${project.name}`),
    h(ProjectForm, { project, submitLabel: "Update", onSubmit: handleSubmit, errors })
  )
}

import { createElement as h, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCreateProject } from "hooks/projects/useCreateProject"
import type { ChangeEvent, FormEvent } from "react"
import type { Project } from "hooks/projects/useProjects"

declare global {
  interface Window {
    Turbo?: { visit: (path: string) => void }
  }
}

type ProjectFormProps = {
  project: Partial<Project>
  submitLabel: string
  onSubmit: (project: Partial<Project>) => void
  errors: string[]
}

function showFlash(message: string) {
  window.sessionStorage?.setItem("tinyci.flash.notice", message)

  let flash = document.getElementById("flash")
  if (!flash) {
    flash = document.createElement("div")
    flash.id = "flash"
    document.getElementById("body")?.prepend(flash)
  }
  flash.className = "notice"
  flash.textContent = message
}

function ErrorSummary({ errors }: { errors: string[] }) {
  const { t } = useTranslation()

  if (!errors.length) return null

  return h(
    "div",
    { className: "errorExplanation" },
    h("h2", null, t("spa.projects.save_error")),
    h("ul", null, errors.map((error) => h("li", { key: error }, error)))
  )
}

function ProjectForm({ project, submitLabel, onSubmit, errors }: ProjectFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(project.name || "")
  const [description, setDescription] = useState(project.description || "")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ name, description })
  }

  return h(
    "form",
    { onSubmit: handleSubmit },
    h(ErrorSummary, { errors }),
    h(
      "p",
      { className: "form_item" },
      h("span", { className: "label" }, h("label", { htmlFor: "project_name" }, t("projects.form.name"))),
      h(
        "span",
        { className: "desc" },
        t("projects.form.name_description")
      ),
      h("input", {
        id: "project_name",
        name: "project[name]",
        type: "text",
        value: name,
        onChange: (event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)
      })
    ),
    h(
      "p",
      { className: "form_item" },
      h("span", { className: "label" }, h("label", { htmlFor: "project_description" }, t("projects.form.description"))),
      h("textarea", {
        id: "project_description",
        name: "project[description]",
        rows: 5,
        value: description,
        onChange: (event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)
      })
    ),
    h("input", { type: "submit", value: submitLabel })
  )
}

export { ProjectForm, showFlash }

export default function NewProjectPage() {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<string[]>([])
  const { createProject } = useCreateProject()

  async function handleSubmit(project: Partial<Project>) {
    const result = await createProject(project)
    if (!result.ok) {
      setErrors(result.errors ?? [])
      return
    }

    showFlash(t("flash.notice.created_project"))
    const projectPath = `/projects/${encodeURIComponent(result.project.name)}/plans`
    if (window.Turbo) {
      window.Turbo.visit(projectPath)
    } else {
      window.location.href = projectPath
    }
  }

  return h("div", null, h("h1", null, t("projects.new.new_project")), h(ProjectForm, { project: {}, submitLabel: t("projects.new.create"), onSubmit: handleSubmit, errors }))
}

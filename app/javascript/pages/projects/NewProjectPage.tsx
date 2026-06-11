import { createElement as h, useState } from "react"
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
  if (!errors.length) return null

  return h(
    "div",
    { className: "errorExplanation" },
    h("h2", null, "Project could not be saved"),
    h("ul", null, errors.map((error) => h("li", { key: error }, error)))
  )
}

function ProjectForm({ project, submitLabel, onSubmit, errors }: ProjectFormProps) {
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
      h("span", { className: "label" }, h("label", { htmlFor: "project_name" }, "Name")),
      h(
        "span",
        { className: "desc" },
        "The project's name will appear in the URL. Changes to the name will change all URLs for this project. Only characters, numbers, underscores and dashes are allowed in the name."
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
      h("span", { className: "label" }, h("label", { htmlFor: "project_description" }, "Description")),
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
  const [errors, setErrors] = useState<string[]>([])
  const { createProject } = useCreateProject()

  async function handleSubmit(project: Partial<Project>) {
    const result = await createProject(project)
    if (!result.ok) {
      setErrors(result.errors ?? [])
      return
    }

    showFlash("Successfully created project")
    if (window.Turbo) {
      window.Turbo.visit("/projects")
    } else {
      window.location.href = "/projects"
    }
  }

  return h("div", null, h("h1", null, "New Project"), h(ProjectForm, { project: {}, submitLabel: "Create", onSubmit: handleSubmit, errors }))
}

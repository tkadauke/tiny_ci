import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"
import { FormField, inputClassName } from "@/components/ui/FormField"
import { PageHeader } from "@/components/ui/PageHeader"
import { useCreateProject } from "hooks/projects/useCreateProject"
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
    document.getElementById("root")?.prepend(flash)
  }
  flash.className = "mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
  flash.textContent = message
}

function ErrorSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null

  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p className="font-medium">Project could not be saved</p>
      <ul className="mt-2 list-disc pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}

function ProjectForm({ project, submitLabel, onSubmit, errors }: ProjectFormProps) {
  const [name, setName] = useState(project.name || "")
  const [description, setDescription] = useState(project.description || "")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ name, description })
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit}>
          <ErrorSummary errors={errors} />
          <FormField label="Name">
            <input
              className={inputClassName}
              id="project_name"
              name="project[name]"
              type="text"
              value={name}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
            />
          </FormField>
          <p className="-mt-2 mb-4 text-sm text-gray-500">
            The project's name will appear in the URL. Changes to the name will change all URLs for this project.
          </p>
          <FormField label="Description">
            <textarea
              className={inputClassName}
              id="project_description"
              name="project[description]"
              rows={5}
              value={description}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
            />
          </FormField>
          <div className="flex items-center gap-3">
            <Button type="submit">{submitLabel === "Create" ? "Save" : submitLabel}</Button>
            <a className="text-sm text-gray-600 hover:text-gray-900" href="/projects">
              Cancel
            </a>
          </div>
        </form>
      </CardBody>
    </Card>
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
    const projectPath = `/projects/${encodeURIComponent(result.project.name)}/plans`
    if (window.Turbo) {
      window.Turbo.visit(projectPath)
    } else {
      window.location.href = projectPath
    }
  }

  return (
    <>
      <PageHeader title="New Project" />
      <ProjectForm project={{}} submitLabel="Save" onSubmit={handleSubmit} errors={errors} />
    </>
  )
}

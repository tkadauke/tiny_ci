import { Button } from "@/components/ui/Button"
import { Card, CardBody } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { Table, Td, Th, Tr } from "@/components/ui/Table"
import { useProjects } from "hooks/projects/useProjects"
import type { Project } from "hooks/projects/useProjects"

function truncateDescription(description?: string | null) {
  const value = description || ""
  if (value.length <= 40) return value

  return `${value.slice(0, 37)}...`
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <Tr>
      <Td>
        <a className="font-medium text-blue-600 hover:text-blue-500" href={`/projects/${encodeURIComponent(project.name)}/plans`}>
          {project.name}
        </a>
      </Td>
      <Td className="whitespace-normal">{truncateDescription(project.description)}</Td>
      <Td>
        <a className="text-blue-600 hover:text-blue-500" href={`/projects/${encodeURIComponent(project.name)}/edit`}>
          Edit
        </a>
      </Td>
    </Tr>
  )
}

export default function ProjectsPage({ can_create_projects }: { can_create_projects?: boolean }) {
  const { projects, loading, errors } = useProjects()

  return (
    <>
      <PageHeader
        title="Listing Projects"
        actions={
          can_create_projects ? (
            <Button type="button" onClick={() => (window.location.href = "/projects/new")}>
              New Project
            </Button>
          ) : null
        }
      />
      {errors.length > 0 ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <Card>
        <CardBody>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Options</Th>
              </tr>
            </thead>
            <tbody>{loading ? null : projects.map((project) => <ProjectRow key={project.id || project.name} project={project} />)}</tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  )
}

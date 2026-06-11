import { createElement as h } from "react"
import { useProjects } from "hooks/projects/useProjects"

function truncateDescription(description) {
  const value = description || ""
  if (value.length <= 40) return value

  return `${value.slice(0, 37)}...`
}

function ProjectRow({ project }) {
  return h(
    "tr",
    { key: project.id || project.name },
    h("td", null, h("a", { href: `/projects/${encodeURIComponent(project.name)}/plans` }, project.name)),
    h("td", null, truncateDescription(project.description)),
    h("td", null, h("a", { href: `/projects/${encodeURIComponent(project.name)}/edit` }, "Edit"))
  )
}

export default function ProjectsPage({ can_create_projects }) {
  const { projects, loading, errors } = useProjects()

  return h(
    "div",
    null,
    h("h1", null, "Listing Projects"),
    errors.length > 0 &&
      h(
        "div",
        { className: "errorExplanation" },
        h("ul", null, errors.map((error) => h("li", { key: error }, error)))
      ),
    h(
      "table",
      { className: "list" },
      h(
        "thead",
        null,
        h("tr", null, h("th", null, "Name"), h("th", null, "Description"), h("th", null, "Options"))
      ),
      h("tbody", null, loading ? null : projects.map((project) => h(ProjectRow, { key: project.id || project.name, project })))
    ),
    can_create_projects &&
      h("p", null, h("button", { type: "button", onClick: () => (window.location.href = "/projects/new") }, "New Project"))
  )
}

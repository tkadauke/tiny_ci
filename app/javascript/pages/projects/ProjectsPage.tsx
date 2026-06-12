import { createElement as h } from "react"
import { useTranslation } from "react-i18next"
import { useProjects } from "hooks/projects/useProjects"
import type { Project } from "hooks/projects/useProjects"

function truncateDescription(description?: string | null) {
  const value = description || ""
  if (value.length <= 40) return value

  return `${value.slice(0, 37)}...`
}

function ProjectRow({ project }: { project: Project }) {
  const { t } = useTranslation()

  return h(
    "tr",
    { key: project.id || project.name },
    h("td", null, h("a", { href: `/projects/${encodeURIComponent(project.name)}/plans` }, project.name)),
    h("td", null, truncateDescription(project.description)),
    h("td", null, h("a", { href: `/projects/${encodeURIComponent(project.name)}/edit` }, t("projects.index.edit")))
  )
}

export default function ProjectsPage({ can_create_projects }: { can_create_projects?: boolean }) {
  const { t } = useTranslation()
  const { projects, loading, errors } = useProjects()

  return h(
    "div",
    null,
    h("h1", null, t("projects.index.listing_projects")),
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
        h("tr", null, h("th", null, t("projects.index.name")), h("th", null, t("projects.index.description")), h("th", null, t("projects.index.options")))
      ),
      h("tbody", null, loading ? null : projects.map((project) => h(ProjectRow, { key: project.id || project.name, project })))
    ),
    can_create_projects &&
      h("p", null, h("button", { type: "button", onClick: () => (window.location.href = "/projects/new") }, t("projects.index.new_project")))
  )
}

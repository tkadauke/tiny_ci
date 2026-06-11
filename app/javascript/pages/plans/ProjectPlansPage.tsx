import { useParams } from "react-router-dom"
import { PlansPage } from "@/pages/plans/plansPageRuntime"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function ProjectPlansPage() {
  const { projectId = "" } = useParams()
  const { data: currentUser } = useCurrentUser()
  const encodedProjectId = encodeURIComponent(projectId)
  const basePath = `/projects/${encodedProjectId}/plans`

  return (
    <PlansPage
      heading="Listing Plans"
      endpoint={`/api/projects/${encodedProjectId}/plans`}
      basePath={basePath}
      canCreatePlans={currentUser.can_create_plans}
      newPlanPath={`${basePath}/new`}
    />
  )
}

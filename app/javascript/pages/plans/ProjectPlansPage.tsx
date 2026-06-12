import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PlanListing } from "@/pages/plans/PlanListing";

export default function ProjectPlansPage() {
  const { t } = useTranslation();
  const { projectId = "" } = useParams();
  const { data: currentUser } = useCurrentUser();
  const encodedProjectId = encodeURIComponent(projectId);
  const basePath = `/projects/${encodedProjectId}/plans`;

  return (
    <PlanListing
      heading={t("plans.index.listing_plans")}
      endpoint={`/api/projects/${encodedProjectId}/plans`}
      basePath={basePath}
      canCreatePlans={currentUser.can_create_plans}
      newPlanPath={`${basePath}/new`}
    />
  );
}

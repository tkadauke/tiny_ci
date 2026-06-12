import { PlanListing } from "@/pages/plans/PlanListing";
import { useTranslation } from "react-i18next";

export default function AllPlansPage() {
  const { t } = useTranslation();

  return <PlanListing heading={t("plans.full_index.listing_all_plans")} endpoint="/api/plans" basePath="/plans" />;
}

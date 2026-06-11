import { PlanListing } from "@/pages/plans/PlanListing";

export default function AllPlansPage() {
  return <PlanListing heading="Listing All Plans" endpoint="/api/plans" basePath="/plans" />;
}

import { PlansPage } from "@/pages/plans/plansPageRuntime"

export default function AllPlansPage() {
  return <PlansPage heading="Listing All Plans" endpoint="/api/plans" basePath="/plans" />
}

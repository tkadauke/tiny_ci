import { mountPlansPage } from "@/pages/plans/plansPageRuntime"

export function mountAllPlansPage(element) {
  mountPlansPage(element, {
    heading: "Listing All Plans",
    endpoint: "/api/plans",
    basePath: "/plans"
  })
}

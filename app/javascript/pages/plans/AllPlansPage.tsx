import { mountPlansPage } from "@/pages/plans/plansPageRuntime"

export function mountAllPlansPage(element: HTMLElement) {
  mountPlansPage(element, {
    heading: "Listing All Plans",
    endpoint: "/api/plans",
    basePath: "/plans"
  })
}

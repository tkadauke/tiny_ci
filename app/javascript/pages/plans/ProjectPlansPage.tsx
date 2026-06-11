import { mountPlansPage } from "@/pages/plans/plansPageRuntime"

export function mountProjectPlansPage(element: HTMLElement) {
  mountPlansPage(element, {
    heading: "Listing Plans",
    endpoint: element.dataset.endpoint || "",
    basePath: element.dataset.basePath || window.location.pathname,
    canCreatePlans: element.dataset.canCreatePlans === "true",
    newPlanPath: element.dataset.newPlanPath
  })
}

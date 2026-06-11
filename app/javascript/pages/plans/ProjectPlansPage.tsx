import { mountPlansPage } from "@/pages/plans/plansPageRuntime"

export function mountProjectPlansPage(element) {
  mountPlansPage(element, {
    heading: "Listing Plans",
    endpoint: element.dataset.endpoint,
    basePath: element.dataset.basePath,
    canCreatePlans: element.dataset.canCreatePlans === "true",
    newPlanPath: element.dataset.newPlanPath
  })
}

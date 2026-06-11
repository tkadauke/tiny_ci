import type { Worker } from "./useWorkers"
import { submitWorker } from "./useWorkers"

export function useUpdateWorker(name: string) {
  return {
    updateWorker: (worker: Partial<Worker>) =>
      submitWorker<Worker>(`/api/admin/workers/${encodeURIComponent(name)}`, "PATCH", worker),
  }
}

import type { Worker } from "./useWorkers"
import { submitWorker } from "./useWorkers"

export function useCreateWorker() {
  return {
    createWorker: (worker: Partial<Worker>) => submitWorker<Worker>("/api/admin/workers", "POST", worker),
  }
}

import type { Slave } from "./useSlaves"
import { submitSlave } from "./useSlaves"

export function useCreateSlave() {
  return {
    createSlave: (slave: Partial<Slave>) => submitSlave<Slave>("/api/admin/slaves", "POST", slave),
  }
}

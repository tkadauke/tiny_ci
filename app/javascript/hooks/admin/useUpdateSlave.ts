import type { Slave } from "./useSlaves"
import { submitSlave } from "./useSlaves"

export function useUpdateSlave(name: string) {
  return {
    updateSlave: (slave: Partial<Slave>) =>
      submitSlave<Slave>(`/api/admin/slaves/${encodeURIComponent(name)}`, "PATCH", slave),
  }
}

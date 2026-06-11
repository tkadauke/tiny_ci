import { csrfToken } from "./useSlaves"

export function useDeleteSlave(name: string) {
  return {
    deleteSlave: async () => {
      const response = await fetch(`/api/admin/slaves/${encodeURIComponent(name)}`, {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-CSRF-Token": csrfToken(),
        },
      })

      if (!response.ok) throw new Error(`Request failed with ${response.status}`)
    },
  }
}

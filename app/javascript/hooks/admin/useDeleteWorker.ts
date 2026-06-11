import { csrfToken } from "./useWorkers"

export function useDeleteWorker(name: string) {
  return {
    deleteWorker: async () => {
      const response = await fetch(`/api/admin/workers/${encodeURIComponent(name)}`, {
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

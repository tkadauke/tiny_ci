import { useEffect, useState } from "react"
import type { Slave } from "./useSlaves"

export function useSlave(name: string | null) {
  const [slave, setSlave] = useState<Slave | null>(null)
  const [loading, setLoading] = useState(Boolean(name))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!name) return

    let active = true
    setLoading(true)

    fetch(`/api/admin/slaves/${encodeURIComponent(name)}`, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (active) setSlave(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [name])

  return { slave, loading, error }
}

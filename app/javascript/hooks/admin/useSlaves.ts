import { useEffect, useState } from "react"

export type Slave = {
  name: string
  hostname: string | null
  protocol: "localhost" | "ssh" | string
  offline: boolean
  busy: boolean
  capabilities: string | null
  max_builds: number | string | null
  username: string | null
  password?: string | null
  base_path: string | null
  default_base_path?: string | null
  environment_variables: Record<string, { key?: string | null; value?: string | null }> | null
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })

  if (!response.ok) throw new Error(`Request failed with ${response.status}`)
  return response.json()
}

export function useSlaves() {
  const [slaves, setSlaves] = useState<Slave[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetchJson<Slave[]>("/api/admin/slaves")
      .then((data) => {
        if (active) setSlaves(data)
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
  }, [])

  return { slaves, loading, error, setSlaves }
}

export function csrfToken() {
  return document.querySelector<HTMLMetaElement>("meta[name='csrf-token']")?.content || ""
}

export async function submitSlave<T>(url: string, method: string, slave: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify({ slave }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errors = Array.isArray(data.errors) ? data.errors.join(", ") : `Request failed with ${response.status}`
    throw new Error(errors)
  }

  return data
}

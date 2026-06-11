import { useEffect, useState } from "react"

export type Project = {
  id?: number
  name: string
  description?: string | null
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    let active = true

    fetch("/api/projects", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load projects")
        return response.json()
      })
      .then((data: Project[]) => {
        if (!active) return
        setProjects(data)
        setErrors([])
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrors([error instanceof Error ? error.message : "Unable to load projects"])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { projects, loading, errors }
}

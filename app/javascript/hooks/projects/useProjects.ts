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
      .then((data) => {
        if (!active) return
        setProjects(data)
        setErrors([])
      })
      .catch((error) => {
        if (!active) return
        setErrors([error.message])
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

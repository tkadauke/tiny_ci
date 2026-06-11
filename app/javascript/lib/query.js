import React from "react"

const QueryClientContext = React.createContext(null)

export class QueryClient {
  constructor() {
    this.listeners = new Map()
  }

  invalidateQueries(queryKey) {
    const key = JSON.stringify(queryKey)
    const listeners = this.listeners.get(key) || []
    listeners.forEach((listener) => listener())
  }

  subscribe(queryKey, listener) {
    const key = JSON.stringify(queryKey)
    const listeners = this.listeners.get(key) || []
    listeners.push(listener)
    this.listeners.set(key, listeners)

    return () => {
      this.listeners.set(key, listeners.filter((item) => item !== listener))
    }
  }
}

export function QueryClientProvider({ client, children }) {
  return React.createElement(QueryClientContext.Provider, { value: client }, children)
}

export function useQueryClient() {
  const client = React.useContext(QueryClientContext)
  if (!client) throw new Error("No QueryClient configured")
  return client
}

export function useQuery({ queryKey, queryFn, enabled = true, initialData = null }) {
  const client = useQueryClient()
  const [state, setState] = React.useState({
    data: initialData,
    error: null,
    isLoading: enabled,
  })

  const fetchData = React.useCallback(() => {
    if (!enabled) return

    setState((current) => ({ ...current, isLoading: true }))
    queryFn()
      .then((data) => setState({ data, error: null, isLoading: false }))
      .catch((error) => setState({ data: null, error, isLoading: false }))
  }, [enabled, queryFn])

  React.useEffect(() => {
    fetchData()
    return client.subscribe(queryKey, fetchData)
  }, [client, fetchData, queryKey])

  return state
}


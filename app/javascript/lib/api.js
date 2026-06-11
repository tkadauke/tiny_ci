export function csrfToken() {
  return document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
}

export async function fetchJson(url, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  }
  const token = csrfToken()
  if (token) headers["X-CSRF-Token"] = token

  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

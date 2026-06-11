import type { ReactElement } from "react"
import EditSlavePage from "./EditSlavePage"
import NewSlavePage from "./NewSlavePage"
import SlaveShowPage from "./SlaveShowPage"
import SlavesPage from "./SlavesPage"

type Route = {
  pattern: RegExp
  render: (match: RegExpMatchArray) => ReactElement
}

export const adminSlaveRoutes: Route[] = [
  {
    pattern: /^\/admin\/slaves\/?$/,
    render: () => <SlavesPage />,
  },
  {
    pattern: /^\/admin\/slaves\/new\/?$/,
    render: () => <NewSlavePage />,
  },
  {
    pattern: /^\/admin\/slaves\/([^/]+)\/edit\/?$/,
    render: (match) => <EditSlavePage name={decodeURIComponent(match[1])} />,
  },
  {
    pattern: /^\/admin\/slaves\/([^/]+)\/?$/,
    render: (match) => <SlaveShowPage name={decodeURIComponent(match[1])} />,
  },
]

export function matchAdminSlaveRoute(pathname = window.location.pathname) {
  for (const route of adminSlaveRoutes) {
    const match = pathname.match(route.pattern)
    if (match) return route.render(match)
  }

  return null
}

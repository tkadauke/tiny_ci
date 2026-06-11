import React from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DashboardPage } from "@/pages/DashboardPage.js"
import { setQueryClient } from "@/lib/api"
import { setStatusIcons } from "@/lib/assets.js"

const queryClient = new QueryClient()
setQueryClient(queryClient)

function mountDashboard() {
  const root = document.getElementById("dashboard-root")
  if (!root) return

  root.reactRoot ||= createRoot(root)
  setStatusIcons(JSON.parse(root.dataset.statusIcons || "{}"))

  root.reactRoot.render(
    React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(DashboardPage))
  )
}

document.addEventListener("turbo:load", mountDashboard)

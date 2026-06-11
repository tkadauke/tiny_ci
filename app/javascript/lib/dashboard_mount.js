import React from "react"
import { createRoot } from "react-dom/client"
import { DashboardPage } from "pages/DashboardPage"
import { setStatusIcons } from "lib/assets"

function booleanData(root, name) {
  return root.dataset[name] === "true"
}

function mountDashboard() {
  const root = document.getElementById("dashboard-root")
  if (!root) return

  root.reactRoot ||= createRoot(root)
  setStatusIcons(JSON.parse(root.dataset.statusIcons || "{}"))

  const currentUser = {
    loggedIn: booleanData(root, "loggedIn"),
    initialAdmin: booleanData(root, "initialAdmin"),
    canCreateAccounts: booleanData(root, "canCreateAccounts"),
  }

  root.reactRoot.render(React.createElement(DashboardPage, { currentUser }))
}

document.addEventListener("turbo:load", mountDashboard)

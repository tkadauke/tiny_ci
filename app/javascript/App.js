import React from "react"
import { createRoot } from "react-dom/client"
import SetupWizardApp from "pages/setup/SetupWizardApp"

export function startApp() {
  if (!window.location.pathname.startsWith("/admin/setup")) return

  const rootElement = document.getElementById("react-root")
  if (!rootElement) return

  createRoot(rootElement).render(React.createElement(SetupWizardApp))
}

export default startApp

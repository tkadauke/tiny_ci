import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { mountBuildHistoryPage } from "@/pages/builds/BuildHistoryPage";
import SetupWizardApp from "@/pages/setup/SetupWizardApp";
import "./lib/dashboard_mount";
import "./styles/application.css";

const rootElement = document.getElementById("root");

if (rootElement?.dataset.reactApp === "true") {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

const setupRootElement = document.getElementById("react-root");

if (setupRootElement && window.location.pathname.startsWith("/admin/setup")) {
  createRoot(setupRootElement).render(
    <React.StrictMode>
      <SetupWizardApp />
    </React.StrictMode>
  );
}

const buildHistoryPageElement = document.getElementById("build-history-page");

if (buildHistoryPageElement) {
  mountBuildHistoryPage(buildHistoryPageElement);
}

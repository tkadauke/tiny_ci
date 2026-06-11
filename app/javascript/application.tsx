import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { mountBuildDetailPage } from "@/pages/builds/BuildDetailPage";
import { mountBuildHistoryPage } from "@/pages/builds/BuildHistoryPage";
import { mountAllPlansPage } from "@/pages/plans/AllPlansPage";
import { mountProjectPlansPage } from "@/pages/plans/ProjectPlansPage";
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

const buildDetailPageElement = document.querySelector<HTMLElement>("[data-react-page='build-detail']");

if (buildDetailPageElement) {
  mountBuildDetailPage(buildDetailPageElement);
}

function mountReactPages() {
  const allPlansRoot = document.getElementById("react-all-plans-page");
  if (allPlansRoot) mountAllPlansPage(allPlansRoot);

  const projectPlansRoot = document.getElementById("react-project-plans-page");
  if (projectPlansRoot) mountProjectPlansPage(projectPlansRoot);
}

document.addEventListener("turbo:load", mountReactPages);
document.addEventListener("DOMContentLoaded", mountReactPages);

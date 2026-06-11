import React, { type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { mountBuildDetailPage } from "@/pages/builds/BuildDetailPage";
import { mountBuildHistoryPage } from "@/pages/builds/BuildHistoryPage";
import SetupWizardApp from "@/pages/setup/SetupWizardApp";
import EditProjectPage from "@/pages/projects/EditProjectPage";
import NewProjectPage from "@/pages/projects/NewProjectPage";
import ProjectsPage from "@/pages/projects/ProjectsPage";
import "./lib/dashboard_mount";
import "./styles/application.css";

const pages: Record<string, ComponentType<any>> = {
  ProjectsPage,
  NewProjectPage,
  EditProjectPage,
};

function parseProps(element: HTMLElement): Record<string, unknown> {
  if (!element.dataset.props) return {};

  return JSON.parse(element.dataset.props);
}

function mountReactPages() {
  document.querySelectorAll<HTMLElement>("[data-react-page]").forEach((element) => {
    if (element.dataset.reactMounted) return;

    const pageName = element.dataset.reactPage;
    const Page = pageName ? pages[pageName] : undefined;
    if (!Page) return;

    element.dataset.reactMounted = "true";
    createRoot(element).render(<Page {...parseProps(element)} />);
  });
}

function showStoredFlash() {
  const message = window.sessionStorage?.getItem("tinyci.flash.notice");
  if (!message) return;

  window.sessionStorage.removeItem("tinyci.flash.notice");

  let flash = document.getElementById("flash");
  if (!flash) {
    flash = document.createElement("div");
    flash.id = "flash";
    document.getElementById("body")?.prepend(flash);
  }
  flash.className = "notice";
  flash.textContent = message;
}

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

document.addEventListener("turbo:load", mountReactPages);
document.addEventListener("turbo:load", showStoredFlash);
document.addEventListener("DOMContentLoaded", mountReactPages);
document.addEventListener("DOMContentLoaded", showStoredFlash);

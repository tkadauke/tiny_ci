import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import SetupWizardApp from "@/pages/setup/SetupWizardApp";
import "./styles/application.css";

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

document.addEventListener("turbo:load", showStoredFlash);
document.addEventListener("DOMContentLoaded", showStoredFlash);

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

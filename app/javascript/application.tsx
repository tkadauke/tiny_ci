import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/application.css";

const rootElement = document.getElementById("root");

if (rootElement?.dataset.reactApp === "true") {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

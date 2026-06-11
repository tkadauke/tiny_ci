import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelpTopicPage } from "HelpTopicPage";

const queryClient = new QueryClient();

export function mountHelpTopicsApp() {
  const rootElement = document.getElementById("react-help-topic-root");

  if (!rootElement) {
    return;
  }

  if (rootElement.dataset.reactMounted === "true") {
    return;
  }

  rootElement.dataset.reactMounted = "true";

  createRoot(rootElement).render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: "/help_topics/*", element: React.createElement(HelpTopicPage) })
        )
      )
    )
  );
}

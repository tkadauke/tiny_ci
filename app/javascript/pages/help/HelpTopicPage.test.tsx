import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/renderWithProviders";
import { HelpTopicPage } from "./HelpTopicPage";

function renderHelpTopic(route = "/help_topics/test") {
  return renderWithProviders(
    <Routes>
      <Route path="/help_topics/*" element={<HelpTopicPage />} />
    </Routes>,
    { route },
  );
}

test("renders help content returned by the MSW fixture", async () => {
  renderHelpTopic();

  expect(await screen.findByRole("heading", { name: "Help topic" })).toBeInTheDocument();
  expect(screen.getByText("Fixture help topic.")).toBeInTheDocument();
});

test("shows a not-found message when the API returns 404", async () => {
  server.use(http.get("/api/help_topics/*", () => new HttpResponse(null, { status: 404 })));

  renderHelpTopic("/help_topics/missing");

  expect(await screen.findByRole("heading", { name: "Help topic not found" })).toBeInTheDocument();
  expect(screen.getByText("The requested help topic could not be found.")).toBeInTheDocument();
});

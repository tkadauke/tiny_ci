import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createElement, type ReactNode } from "react";
import { server } from "@/test/setup";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useBuilds } from "./useBuilds";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: createTestQueryClient() }, children);
}

test("returns the list from the MSW fixture", async () => {
  const { result } = renderHook(() => useBuilds("tiny-ci", "main"), { wrapper });

  await waitFor(() => expect(result.current.data).toHaveLength(1));

  expect(result.current.data?.[0]).toMatchObject({ id: 101, status: "success" });
});

test("handles an empty array", async () => {
  server.use(
    http.get("/api/projects/:projectId/plans/:planId/builds", () => HttpResponse.json([])),
  );
  const { result } = renderHook(() => useBuilds("tiny-ci", "main"), { wrapper });

  await waitFor(() => expect(result.current.data).toEqual([]));
});

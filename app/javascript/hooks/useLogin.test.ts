import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createElement, type ReactNode } from "react";
import { server } from "@/test/server";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useLogin } from "./useLogin";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: createTestQueryClient() }, children);
}

test("successful POST to /api/session resolves without error", async () => {
  const { result } = renderHook(() => useLogin(), { wrapper });

  await expect(
    result.current.mutateAsync({ login: "admin", password: "secret" }),
  ).resolves.toMatchObject({ login: "admin" });
});

test("422 response rejects with the error message from the body", async () => {
  server.use(
    http.post("/api/session", () =>
      HttpResponse.json({ error: "Account is locked" }, { status: 422 }),
    ),
  );
  const { result } = renderHook(() => useLogin(), { wrapper });

  await expect(
    result.current.mutateAsync({ login: "admin", password: "wrong" }),
  ).rejects.toThrow("Account is locked");
});

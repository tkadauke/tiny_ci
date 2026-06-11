import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { createElement, type ReactNode } from "react";
import { server } from "@/test/server";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useCurrentUser } from "./useCurrentUser";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: createTestQueryClient() }, children);
}

test("returns a guest user from the API fixture", async () => {
  const { result } = renderHook(() => useCurrentUser(), { wrapper });

  await waitFor(() => expect(result.current.isFetching).toBe(false));

  expect(result.current.data.guest).toBe(true);
});

test("returns a logged-in user from the API fixture", async () => {
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json({
        guest: false,
        login: "admin",
        email: "admin@example.com",
        role: "admin",
        initial_admin: false,
        can_configure_slaves: true,
        can_configure_system_variables: true,
        can_create_accounts: true,
        can_create_projects: true,
        can_edit_projects: true,
        can_create_plans: true,
        can_edit_plans: true,
        can_destroy_plans: true,
      }),
    ),
  );

  const { result } = renderHook(() => useCurrentUser(), { wrapper });

  await waitFor(() => expect(result.current.data.login).toBe("admin"));
});

test("enters the error state when the API returns 500", async () => {
  server.use(http.get("/api/me", () => new HttpResponse(null, { status: 500 })));

  const { result } = renderHook(() => useCurrentUser(), { wrapper });

  await waitFor(() => expect(result.current.isError).toBe(true));
});

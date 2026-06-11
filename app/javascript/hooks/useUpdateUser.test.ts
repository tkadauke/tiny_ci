import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { createHookWrapper } from "@/test/hook-utils";
import { useUpdateUser } from "./useUpdateUser";

describe("useUpdateUser", () => {
  it("patches the encoded user endpoint", async () => {
    let requestedPath = "";
    let submitted: unknown;
    server.use(
      http.patch("/api/users/:login", async ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        submitted = await request.json();
        return HttpResponse.json({ login: "jane@example.test", email: "new@example.test", role: "admin" });
      }),
    );
    const { result } = renderHook(() => useUpdateUser(), { wrapper: createHookWrapper() });

    await act(async () => {
      result.current.mutate({ login: "jane@example.test", email: "new@example.test", role: "admin" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestedPath).toBe("/api/users/jane%40example.test");
    expect(submitted).toEqual({ user: { email: "new@example.test", role: "admin" } });
  });
});

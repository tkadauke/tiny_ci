import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { createHookWrapper } from "@/test/hook-utils";
import { useUser } from "./useUser";

describe("useUser", () => {
  it("fetches the encoded user endpoint", async () => {
    let requestedPath = "";
    server.use(
      http.get("/api/users/:login", ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ login: "jane@example.test", email: "jane@example.test", role: "user" });
      }),
    );

    const { result } = renderHook(() => useUser("jane@example.test"), { wrapper: createHookWrapper() });

    await waitFor(() => expect(result.current.data?.login).toBe("jane@example.test"));
    expect(requestedPath).toBe("/api/users/jane%40example.test");
  });
});

import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { act, renderHook } from "@/test/test-utils";
import { server } from "@/test/server";
import useUpdateAdminConfig from "./useUpdateAdminConfig";

describe("useUpdateAdminConfig", () => {
  it("posts config values to the admin configuration endpoint", async () => {
    let submitted: unknown;
    server.use(
      http.post("/api/admin/configuration", async ({ request }) => {
        submitted = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHook(() => useUpdateAdminConfig());

    await act(async () => {
      await result.current.updateAdminConfig({ site_name: "Tiny CI" });
    });

    expect(submitted).toEqual({ config: { site_name: "Tiny CI" } });
  });
});

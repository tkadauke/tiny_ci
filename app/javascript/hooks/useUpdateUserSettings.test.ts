import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { act, renderHook } from "@/test/test-utils";
import { server } from "@/test/server";
import useUpdateUserSettings from "./useUpdateUserSettings";

describe("useUpdateUserSettings", () => {
  it("posts config values to the user settings endpoint", async () => {
    let submitted: unknown;
    server.use(
      http.post("/api/settings", async ({ request }) => {
        submitted = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHook(() => useUpdateUserSettings());

    await act(async () => {
      await result.current.updateUserSettings({ locale: "de" });
    });

    expect(submitted).toEqual({ config: { locale: "de" } });
  });
});

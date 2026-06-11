import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { renderHook, waitFor } from "@/test/test-utils";
import { server } from "@/test/server";
import { createHookWrapper } from "@/test/hook-utils";
import { normalizeHelpTopicPath, useHelpTopic } from "./useHelpTopic";

describe("useHelpTopic", () => {
  it("normalizes paths and returns topic data", async () => {
    server.use(
      http.get("/api/help_topics/plan/child", () => HttpResponse.json({ title: "Child Plans", html: "<p>Help</p>" })),
    );

    const { result } = renderHook(() => useHelpTopic("/plan/child/"), { wrapper: createHookWrapper() });

    await waitFor(() => expect(result.current.data).toEqual({ title: "Child Plans", html: "<p>Help</p>" }));
    expect(normalizeHelpTopicPath(undefined)).toBe("index");
  });

  it("returns notFound for 404 responses", async () => {
    server.use(http.get("/api/help_topics/missing", () => new HttpResponse(null, { status: 404 })));

    const { result } = renderHook(() => useHelpTopic("missing"), { wrapper: createHookWrapper() });

    await waitFor(() => expect(result.current.data).toEqual({ notFound: true }));
  });
});

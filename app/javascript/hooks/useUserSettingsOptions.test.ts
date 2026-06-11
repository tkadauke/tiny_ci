import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@/test/test-utils";
import { configOptionsFixture } from "@/test/handlers";
import useUserSettingsOptions from "./useUserSettingsOptions";

describe("useUserSettingsOptions", () => {
  it("fetches user settings options", async () => {
    const { result } = renderHook(() => useUserSettingsOptions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options).toEqual(configOptionsFixture);
    expect(result.current.error).toBeNull();
  });
});

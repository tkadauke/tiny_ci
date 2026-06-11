import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@/test/test-utils";
import { configOptionsFixture } from "@/test/handlers";
import useAdminConfigOptions from "./useAdminConfigOptions";

describe("useAdminConfigOptions", () => {
  it("fetches admin configuration options", async () => {
    const { result } = renderHook(() => useAdminConfigOptions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options).toEqual(configOptionsFixture);
    expect(result.current.error).toBeNull();
  });
});

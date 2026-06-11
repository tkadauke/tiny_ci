import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@/test/test-utils";
import { createHookWrapper } from "@/test/hook-utils";
import { useCreateUser } from "./useCreateUser";

describe("useCreateUser", () => {
  it("posts to the users endpoint", async () => {
    const { result } = renderHook(() => useCreateUser(), { wrapper: createHookWrapper() });

    await act(async () => {
      result.current.mutate({
        login: "new-user",
        email: "new@example.test",
        password: "secret",
        password_confirmation: "secret",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ login: "new-user" });
  });
});

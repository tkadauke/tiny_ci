import { renderHook, waitFor } from "@testing-library/react";
import { useSlaves } from "./useSlaves";

test("returns the list from the fixture", async () => {
  const { result } = renderHook(() => useSlaves());

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.slaves).toEqual([
    expect.objectContaining({ name: "worker-1", protocol: "localhost" }),
  ]);
  expect(result.current.error).toBeNull();
});

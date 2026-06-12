import { renderHook, waitFor } from "@testing-library/react";
import { useWorkers } from "./useWorkers";

test("returns the list from the fixture", async () => {
  const { result } = renderHook(() => useWorkers());

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.workers).toEqual([
    expect.objectContaining({ name: "builder-1", protocol: "ssh" }),
  ]);
  expect(result.current.error).toBeNull();
});

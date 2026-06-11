import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { createTestQueryClient } from "@/test/renderWithProviders";
import { useBuild } from "./useBuild";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: createTestQueryClient() }, children);
}

test("returns build detail including output rows", async () => {
  const { result } = renderHook(() => useBuild("tiny-ci", "main", "1"), { wrapper });

  await waitFor(() => expect(result.current.data?.output_rows).toHaveLength(1));

  expect(result.current.data).toMatchObject({
    id: 101,
    output_rows: [{ command: "npm test", line: "Tests passed" }],
  });
});

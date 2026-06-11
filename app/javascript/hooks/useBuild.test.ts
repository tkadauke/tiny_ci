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

  await waitFor(() => expect(result.current.data?.output_rows).toHaveLength(2));

  expect(result.current.data).toMatchObject({
    id: 100,
  });
  expect(result.current.data?.output_rows[0]).toMatchObject({
    command: "bundle exec rake",
    line: "Running tests",
  });
});

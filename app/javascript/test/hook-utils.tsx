import React, { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { setQueryClient } from "@/lib/api";

export function createHookWrapper() {
  const queryClient = createTestQueryClient();
  setQueryClient(queryClient);

  return function HookWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

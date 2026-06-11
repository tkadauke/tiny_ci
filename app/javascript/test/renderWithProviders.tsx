import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { FlashProvider } from "@/components/ui/FlashMessage";
import { setQueryClient } from "@/lib/api";

type RenderWithProvidersOptions = RenderOptions & {
  route?: string;
};

export function createTestQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  setQueryClient(queryClient);
  return queryClient;
}

export function TestProviders({
  children,
  queryClient = createTestQueryClient(),
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FlashProvider>{children}</FlashProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", ...renderOptions }: RenderWithProvidersOptions = {},
) {
  window.history.pushState({}, "Test page", route);
  const queryClient = createTestQueryClient();

  return {
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestProviders queryClient={queryClient}>{children}</TestProviders>
      ),
      ...renderOptions,
    }),
  };
}

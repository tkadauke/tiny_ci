import "@testing-library/jest-dom/vitest";
import "@/i18n";
import { configure } from "@testing-library/dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server";

configure({ asyncUtilTimeout: 5000 });

export { server };

vi.mock("@/lib/cable", () => ({
  default: {
    subscriptions: {
      create: vi.fn(() => ({ unsubscribe: vi.fn() })),
    },
  },
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  window.history.pushState({}, "", "/");
  window.sessionStorage.clear();
});

afterAll(() => {
  server.close();
});

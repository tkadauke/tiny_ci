import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import RubyPlugin from "vite-plugin-ruby";

const plugins = process.env.VITEST ? [react()] : [RubyPlugin(), react()];

export default defineConfig({
  plugins,
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    alias: {
      "@": new URL("./app/javascript", import.meta.url).pathname,
      "components": new URL("./app/javascript/components", import.meta.url).pathname,
      "hooks": new URL("./app/javascript/hooks", import.meta.url).pathname,
      "lib": new URL("./app/javascript/lib", import.meta.url).pathname,
      "pages": new URL("./app/javascript/pages", import.meta.url).pathname
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./app/javascript/test/setup.ts"],
    include: ["app/javascript/**/*.test.{ts,tsx}"]
  }
});

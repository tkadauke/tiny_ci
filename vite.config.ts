import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import RubyPlugin from "vite-plugin-ruby";

export default defineConfig({
  plugins: [RubyPlugin(), react()],
  build: {
    rollupOptions: {
      input: {
        application: "app/javascript/application.tsx"
      }
    }
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
    alias: {
      "@": new URL("./app/javascript", import.meta.url).pathname,
      "components": new URL("./app/javascript/components", import.meta.url).pathname,
      "lib": new URL("./app/javascript/lib", import.meta.url).pathname,
      "pages": new URL("./app/javascript/pages", import.meta.url).pathname
    }
  }
});

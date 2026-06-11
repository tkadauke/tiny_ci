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
    alias: {
      "@": "/app/javascript"
    }
  }
});

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
  preview: { port: 3000 },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/main.tsx", "src/App.tsx", "**/*.d.ts"],
    },
  },
});

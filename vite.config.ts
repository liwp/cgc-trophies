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
      exclude: [
        "src/main.tsx",
        "src/App.tsx",
        // Presentational React (pages + components): unit-coverage excluded by
        // design; exercised end-to-end by the Playwright suite (e2e/).
        "src/pages/**",
        "src/components/**",
        "src/styles/**",
        "**/*.d.ts",
      ],
      // Enforced floor on business logic (src/lib). Ratchet upward as coverage
      // improves; do not lower. Current actuals sit a few points above this.
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});

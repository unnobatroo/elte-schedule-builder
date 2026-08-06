import { configDefaults, defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        branches: 68,
        functions: 70,
        lines: 80,
        "server.js": {
          statements: 69,
          branches: 66,
          functions: 57,
          lines: 71,
        },
        "src/utils/**": {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
        "src/App.svelte": {
          statements: 60,
          branches: 48,
          functions: 25,
          lines: 60,
        },
        "src/routes/**": {
          statements: 70,
          branches: 51,
          functions: 80,
          lines: 70,
        },
      },
      exclude: [
        "node_modules/",
        "tests/",
        "e2e/",
        "*.config.js",
        "dist/",
        "playwright-report/",
        "test-results/",
      ],
    },
  },
});

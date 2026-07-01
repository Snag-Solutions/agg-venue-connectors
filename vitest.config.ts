import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@agg/execution-kit": resolve(__dirname, "packages/execution-kit/src/index.ts"),
      "@agg/execution-testkit": resolve(__dirname, "packages/execution-testkit/src/index.ts"),
      "@agg/venue-manifest": resolve(__dirname, "packages/venue-manifest/src/index.ts")
    }
  },
  test: {
    include: ["src/**/*.test.ts", "packages/**/*.test.ts", "connectors/**/*.test.ts"],
    pool: "threads"
  }
});

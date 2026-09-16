import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    environmentOptions: { happyDom: { url: "http://localhost/" } },
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    reporters:
      process.env.GITHUB_ACTIONS ? ["default", "github-actions"] : ["default"],
    setupFiles: ["./tests/setup.ts"],
  },
});

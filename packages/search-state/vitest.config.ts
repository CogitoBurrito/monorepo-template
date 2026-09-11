import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    environmentOptions: { happyDom: { url: "http://localhost/" } },
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    restoreMocks: true,
    setupFiles: ["./tests/setup.ts"],
  },
});

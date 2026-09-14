import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // The `cloudflare:workers` virtual module only exists inside a worker;
      // tests run in node and import the stub instead.
      "cloudflare:workers": fileURLToPath(
        new URL("tests/cloudflare-workers.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
    unstubEnvs: true,
  },
});

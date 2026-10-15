import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    /* Workerd cannot read Vitest's module cache from the host filesystem. */
    fsModuleCache: false,
    reporters:
      process.env.GITHUB_ACTIONS ? ["default", "github-actions"] : ["default"],
  },
});

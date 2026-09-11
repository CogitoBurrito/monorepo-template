import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const routerSourceDirectory = path.dirname(
  fileURLToPath(import.meta.resolve("@jonsun/grazy-router")),
);

export default defineConfig({
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart({
      router: {
        generatedRouteTree: path.join(
          routerSourceDirectory,
          "routeTree.gen.ts",
        ),
        routesDirectory: path.join(routerSourceDirectory, "routes"),
      },
    }),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true },
});

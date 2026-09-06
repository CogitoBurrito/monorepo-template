import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const routerSourceDirectory = dirname(
  fileURLToPath(import.meta.resolve('@start-mono/router')),
)

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart({
      router: {
        routesDirectory: join(routerSourceDirectory, 'routes'),
        generatedRouteTree: join(routerSourceDirectory, 'routeTree.gen.ts'),
      },
    }),
    viteReact(),
  ],
})


import { QueryClient } from '@tanstack/react-query'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createAppRouterFactory } from '@start-mono/router'
import { AboutPage, HomePage } from '@start-mono/site'
import { RootDocument, getRootHead } from './RootDocument'

const createAppRouter = createAppRouterFactory({
  rootHead: getRootHead,
  rootShellComponent: RootDocument,
  routeComponents: {
    '/': HomePage,
    '/about': AboutPage,
  },
})

export function getRouter() {
  const queryClient = new QueryClient()
  const router = createAppRouter({ queryClient })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

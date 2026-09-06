import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

const routeContext = createRootRouteWithContext<{
  queryClient: QueryClient
}>()

export const Route = routeContext()

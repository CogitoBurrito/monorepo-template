import type { QueryClient } from "@tanstack/react-query";

import { createRootRouteWithContext } from "@tanstack/react-router";

const routeContext = createRootRouteWithContext<{
  queryClient: QueryClient;
}>();

export const Route = routeContext();

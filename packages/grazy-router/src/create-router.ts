import { QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  type RootRouteOptions,
  type RouteById,
  type RouteIds,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { Route as RootRoute } from "./routes/__root.js";
import { Route as AboutRoute } from "./routes/about.js";
import { Route as IndexRoute } from "./routes/index.js";
import { routeTree } from "./routeTree.gen.js";

export type AppRouteComponentMap = {
  readonly [TRouteId in PageRouteId]: NonNullable<
    RouteById<typeof routeTree, TRouteId>["options"]["component"]
  >;
};
type AppRouterFactoryOptions = {
  rootHead: RootHead;
  rootShellComponent: RootShellComponent;
  routeComponents: AppRouteComponentMap;
};
type PageRouteId = Exclude<RouteIds<typeof routeTree>, "__root__">;

type RootHead = NonNullable<RootRouteOptions["head"]>;
type RootShellComponent = NonNullable<RootRouteOptions["shellComponent"]>;

type RouteComponentBindings = {
  readonly [TRouteId in PageRouteId]: () => RouteById<
    typeof routeTree,
    TRouteId
  >;
};

export const queryClient = new QueryClient();

export const router = createRouter({
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
});

export function createAppRouterFactory({
  rootHead,
  rootShellComponent,
  routeComponents,
}: AppRouterFactoryOptions) {
  Object.assign(RootRoute.options, {
    head: rootHead,
    shellComponent: rootShellComponent,
  });

  const routeComponentBindings = {
    "/": () => IndexRoute.update({ component: routeComponents["/"] }),
    "/about": () => AboutRoute.update({ component: routeComponents["/about"] }),
  } satisfies RouteComponentBindings;

  for (const bindRouteComponent of Object.values(routeComponentBindings)) {
    bindRouteComponent();
  }

  setupRouterSsrQueryIntegration({ queryClient, router });

  return router;
}

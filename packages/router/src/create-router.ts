import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import type {
  RootRouteOptions,
  RouteById,
  RouteIds,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { Route as RootRoute } from "./routes/__root";
import { Route as AboutRoute } from "./routes/about";
import { Route as IndexRoute } from "./routes/index";

type RootHead = NonNullable<RootRouteOptions["head"]>;
type RootShellComponent = NonNullable<RootRouteOptions["shellComponent"]>;
type PageRouteId = Exclude<RouteIds<typeof routeTree>, "__root__">;

export type AppRouteComponentMap = {
  readonly [TRouteId in PageRouteId]: NonNullable<
    RouteById<typeof routeTree, TRouteId>["options"]["component"]
  >;
};
type RouteComponentBindings = {
  readonly [TRouteId in PageRouteId]: () => RouteById<
    typeof routeTree,
    TRouteId
  >;
};

type AppRouterFactoryOptions = {
  rootHead: RootHead;
  rootShellComponent: RootShellComponent;
  routeComponents: AppRouteComponentMap;
};

export const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
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

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

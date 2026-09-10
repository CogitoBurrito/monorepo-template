import type { router } from "./create-router";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export { queryClient } from "./create-router";

export { createAppRouterFactory } from "./create-router";
export type { AppRouteComponentMap } from "./create-router";
export type { FileRouteTypes, RootRouteChildren } from "./routeTree.gen";
export {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  getRouteApi,
  useRouter,
} from "@tanstack/react-router";

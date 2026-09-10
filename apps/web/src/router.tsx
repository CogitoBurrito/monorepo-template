import { createAppRouterFactory } from "@start-mono/router";
import { AboutPage, HomePage } from "@start-mono/site";
import { RootDocument, getRootHead } from "./RootDocument";

export function getRouter() {
  const router = createAppRouterFactory({
    rootHead: getRootHead,
    rootShellComponent: RootDocument,
    routeComponents: {
      "/": HomePage,
      "/about": AboutPage,
    },
  });

  return router;
}

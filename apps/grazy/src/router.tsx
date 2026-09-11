import { createAppRouterFactory } from "@jonsun/grazy-router";
import { AboutPage, HomePage } from "@jonsun/grazy-site";
import { RootDocument, getRootHead } from "./root-document";

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

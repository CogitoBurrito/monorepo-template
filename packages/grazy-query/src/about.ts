import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

const getAboutContent = createServerFn({ method: "GET" }).handler(async () => ({
  description:
    "TanStack Start gives you type-safe routing, server functions, and modern SSR defaults. Use this as a clean foundation, then layer in your own routes, styling, and add-ons.",
  kicker: "About",
  title: "A small starter with room to grow.",
}));

export const aboutContentQueryOptions = queryOptions({
  queryFn: async () => getAboutContent(),
  queryKey: ["about-content"],
  staleTime: Infinity,
});

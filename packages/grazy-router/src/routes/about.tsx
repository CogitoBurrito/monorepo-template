import { aboutContentQueryOptions } from "@jonsun/grazy-query/about";
import { createFileRoute } from "@tanstack/react-router";
import * as v from "valibot";

const aboutSearchSchema = v.object({
  count: v.optional(v.number(), 0),
  input: v.optional(v.string(), ""),
});

export const Route = createFileRoute("/about")({
  loader: async ({ context }) =>
    context.queryClient.query({
      ...aboutContentQueryOptions,
      staleTime: "static",
    }),
  validateSearch: aboutSearchSchema,
});

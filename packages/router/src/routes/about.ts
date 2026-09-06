import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { aboutContentQueryOptions } from '@start-mono/query/about'

export const Route = createFileRoute('/about')({
  validateSearch: z.object({
    count: z.number().default(0),
    input: z.string().default(''),
  }),
  loader: ({ context }) =>
    context.queryClient.query({
      ...aboutContentQueryOptions,
      staleTime: 'static',
    }),
})

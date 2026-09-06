import { useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { useSelector } from '@tanstack/react-store'
import type { AnyRouter, RegisteredRouter, RouteIds } from '@tanstack/react-router'
import { getSearchStateQueue } from './queue'
import { getOptimisticValue } from './queue-machine'
import type { SearchSchema, SetSearchState, UseSearchStateOptions } from './types'

export function useSearchState<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends RouteIds<TRouter['routeTree']> = RouteIds<TRouter['routeTree']>,
  const TKey extends keyof SearchSchema<TRouter, TFrom> & string = keyof SearchSchema<TRouter, TFrom> & string,
>({ from, key }: UseSearchStateOptions<TRouter, TFrom, TKey>): readonly [
  state: SearchSchema<TRouter, TFrom>[TKey],
  setState: SetSearchState<SearchSchema<TRouter, TFrom>[TKey]>,
] {
  const router = useRouter()
  const queue = getSearchStateQueue(router)
  const binding = useMemo(() => ({ queue, from, key, active: true }), [queue, from, key])
  const validated = useSearch<AnyRouter, string, true, true, unknown>({
    from,
    select: (search: Record<string, unknown>) => search[key],
  })
  const state = useSelector(
    queue.store,
    (queueState) => getOptimisticValue(queueState, key, validated),
    { compare: Object.is },
  ) as SearchSchema<TRouter, TFrom>[TKey]

  useEffect(() => {
    binding.active = true
    const release = binding.queue.retain()
    return () => {
      binding.active = false
      release()
    }
  }, [binding])

  const setState = useCallback<SetSearchState<SearchSchema<TRouter, TFrom>[TKey]>>(
    (value, options) => binding.active
      ? binding.queue.set(binding.from, binding.key, value, options)
      : Promise.resolve(),
    [binding],
  )

  return [state, setState]
}

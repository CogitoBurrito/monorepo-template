import type { AnyRouter, RouteById, RouteIds } from '@tanstack/react-router'

export type SearchSchema<
  TRouter extends AnyRouter,
  TFrom extends RouteIds<TRouter['routeTree']>,
> = RouteById<TRouter['routeTree'], TFrom>['types']['fullSearchSchema']

export type UseSearchStateOptions<
  TRouter extends AnyRouter,
  TFrom extends RouteIds<TRouter['routeTree']>,
  TKey extends keyof SearchSchema<TRouter, TFrom> & string,
> = {
  from: TFrom
  key: TKey
}

export type SetSearchStateOptions = {
  replace?: boolean
}

export type SetSearchState<TValue> = (
  value: TValue | ((previous: TValue) => TValue),
  options?: SetSearchStateOptions,
) => Promise<void>

import { useMemo } from 'react'
import { useRouter, useSearch } from '@tanstack/react-router'
import { Debouncer } from '@tanstack/react-pacer'
import { createStore, useSelector } from '@tanstack/react-store'
import type {
  AnyRouter,
  ParsedLocation,
  RegisteredRouter,
  RouteIds,
} from '@tanstack/react-router'
import type {
  SearchSchema,
  SetSearchStateOptions,
  UseSearchStateOptions,
} from './types'
import { getHistoryThrottleMs } from './history-scheduler'

export type SetSearchStateExperimental<TValue> = (
  value: TValue | ((previous: TValue) => TValue),
  options?: SetSearchStateOptions,
) => void

type OptimisticSearchState = Readonly<{
  search: Record<string, unknown> | null
  pending?: PendingUpdate
  nextBatchId: number
}>

type PendingUpdate = Readonly<{
  id: number
  search: Record<string, unknown>
  replaceHistory: boolean
}>

const navigationKey = '__startMonoSearchStateExperimental'

class ExperimentalSearchState {
  readonly store = createStore<OptimisticSearchState>({
    search: null,
    nextBatchId: 0,
  })
  private readonly pendingStore = createStore(() => this.store.state.pending)
  private readonly urlWriteDebouncer: Debouncer<(batchId: number) => void>
  private unsubscribeFromPendingNavigation: (() => void) | undefined

  constructor(private readonly router: AnyRouter) {
    this.urlWriteDebouncer = new Debouncer(
      (batchId: number) => {
        this.unsubscribeFromPendingNavigation?.()
        this.unsubscribeFromPendingNavigation = undefined
        this.flush(batchId)
      },
      { wait: () => getHistoryThrottleMs() }
    )
    this.pendingStore.subscribe((pending) => {
      if (pending) {
        this.schedule(pending.id)
      }
    })
  }

  set<TValue>(
    key: string,
    value: TValue | ((previous: TValue) => TValue),
    options?: SetSearchStateOptions,
  ): void {
    const state = this.store.get()
    const pending = state.pending
    const previousSearch = (pending?.search
      ?? state.search
      ?? this.router.state.location.search) as Record<string, unknown>
    const previousValue = previousSearch[key] as TValue
    const nextValue = typeof value === 'function'
      ? (value as (previous: TValue) => TValue)(previousValue)
      : value

    if (Object.is(nextValue, previousValue)) {
      return
    }

    const nextPending: PendingUpdate = {
      id: pending?.id ?? state.nextBatchId + 1,
      search: { ...previousSearch, [key]: nextValue },
      replaceHistory: (pending?.replaceHistory ?? true) && options?.replace !== false,
    }
    this.store.setState((state) => ({
      ...state,
      search: nextPending.search,
      pending: nextPending,
      nextBatchId: nextPending.id,
    }))
  }

  private schedule(batchId: number): void {
    this.unsubscribeFromPendingNavigation ??= this.router.subscribe(
      'onBeforeNavigate',
      () => this.clear(),
    )
    this.urlWriteDebouncer.maybeExecute(batchId)
  }

  private flush(batchId: number): void {
    const pending = this.store.get().pending
    if (!pending || pending.id !== batchId) {
      return
    }

    this.store.setState((state) => ({ ...state, pending: undefined }))
    const unsubscribe = this.router.subscribe('onBeforeNavigate', ({ toLocation }) => {
      if (navigationKey in toLocation.state) {
        return
      }
      this.clear()
    })

    try {
      const navigation = this.router.navigate({
        hash: this.router.state.location.hash,
        replace: pending.replaceHistory,
        search: pending.search as never,
        state: (previous: ParsedLocation['state']) => ({
          ...previous,
          [navigationKey]: pending.id,
        }),
        to: this.router.state.location.pathname,
      })

      void navigation.then(
        () => this.clearOptimisticSearch(pending.search),
        () => this.clearOptimisticSearch(pending.search),
      ).finally(unsubscribe)
    } catch {
      unsubscribe()
      this.clearOptimisticSearch(pending.search)
    }
  }

  private clear(): void {
    this.urlWriteDebouncer.cancel()
    this.unsubscribeFromPendingNavigation?.()
    this.unsubscribeFromPendingNavigation = undefined
    this.store.setState((state) => ({
      ...state,
      search: null,
      pending: undefined,
    }))
  }

  private clearOptimisticSearch(search: Record<string, unknown>): void {
    if (this.store.get().search === search) {
      this.store.setState((state) => ({ ...state, search: null }))
    }
  }
}

const states = new WeakMap<AnyRouter, ExperimentalSearchState>()

function getExperimentalSearchState(router: AnyRouter): ExperimentalSearchState {
  let state = states.get(router)
  if (!state) {
    state = new ExperimentalSearchState(router)
    states.set(router, state)
  }
  return state
}

function getOptimisticValue(
  search: Record<string, unknown> | null,
  key: string,
  fallback: unknown,
): unknown {
  return search && Object.prototype.hasOwnProperty.call(search, key)
    ? search[key]
    : fallback
}

export function useSearchStateExperimental<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends RouteIds<TRouter['routeTree']> = RouteIds<TRouter['routeTree']>,
  const TKey extends keyof SearchSchema<TRouter, TFrom> & string = keyof SearchSchema<TRouter, TFrom> & string,
>({ from, key }: UseSearchStateOptions<TRouter, TFrom, TKey>): readonly [
  state: SearchSchema<TRouter, TFrom>[TKey],
  setState: SetSearchStateExperimental<SearchSchema<TRouter, TFrom>[TKey]>,
] {
  const router = useRouter()
  const experimentalState = getExperimentalSearchState(router)
  const validated = useSearch<AnyRouter, string, true, true, unknown>({
    from,
    select: (search: Record<string, unknown>) => search[key],
  })
  const state = useSelector(
    experimentalState.store,
    ({ search }) => getOptimisticValue(search, key, validated),
    { compare: Object.is },
  ) as SearchSchema<TRouter, TFrom>[TKey]
  const setState = useMemo<SetSearchStateExperimental<SearchSchema<TRouter, TFrom>[TKey]>>(
    () => (value, options) => experimentalState.set(key, value, options),
    [experimentalState, key],
  )

  return [state, setState]
}

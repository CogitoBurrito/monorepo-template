import type { AnyRouter, ParsedLocation } from '@tanstack/react-router'
import { HistoryScheduler } from './history-scheduler'
import { QueueStateMachine } from './queue-machine'
import type { QueueBatch } from './queue-machine'
import type { SetSearchStateOptions } from './types'

const navigationKey = '__startMonoSearchState'

class SearchStateQueue {

  private readonly machine = new QueueStateMachine()
  readonly store = this.machine.store
  private consumers = 0
  private unsubscribeFromNavigation: (() => void) | undefined
  private readonly historyScheduler

  constructor(private readonly router: AnyRouter) {
    this.historyScheduler = new HistoryScheduler((batchId) => void this.flush(batchId))
  }

  retain() {
    this.consumers += 1
    if (this.consumers === 1) this.subscribeToNavigation()
    return () => this.release()
  }

  set<TValue>(
    from: string,
    key: string,
    value: TValue | ((previous: TValue) => TValue),
    options?: SetSearchStateOptions,
  ): Promise<void> {
    const search = this.findRouteSearch(from)
    if (!search) return Promise.resolve()

    const previous = this.machine.getOptimisticValue(key, search[key]) as TValue
    const next = typeof value === 'function'
      ? (value as (previous: TValue) => TValue)(previous)
      : value

    const update = this.machine.queueUpdate(key, previous, next, options?.replace !== false)
    if (update.shouldSchedule) {
      queueMicrotask(() => void this.flush(update.batch.id))
    }
    return update.promise
  }

  private subscribeToNavigation() {
    this.unsubscribeFromNavigation = this.router.subscribe(
      'onBeforeNavigate',
      ({ toLocation }) => this.handleBeforeNavigate(toLocation),
    )
  }

  private release() {
    this.consumers -= 1
    if (this.consumers !== 0) return
    this.unsubscribeFromNavigation?.()
    this.unsubscribeFromNavigation = undefined
    this.cancelBatches()
  }

  private handleBeforeNavigate(toLocation: Pick<ParsedLocation, 'state'>) {
    const owner = navigationKey in toLocation.state ? toLocation.state[navigationKey] : undefined
    if (!this.machine.markNavigationStarted(owner)) {
      this.cancelBatches()
      return
    }
    this.historyScheduler.recordWrite()
  }

  private findRouteSearch(from: string): Record<string, unknown> | undefined {
    return this.router.matchRoutes(
      this.router.latestLocation.pathname,
      this.router.latestLocation.search,
    )
      .find((candidate) => candidate.routeId === from)
      ?.search as Record<string, unknown> | undefined
  }

  private async flush(batchId: number) {
    if (!this.machine.hasPendingBatch(batchId)) return
    if (this.historyScheduler.deferIfNeeded(batchId)) return

    const started = this.machine.startPendingBatch(batchId)
    if (!started) return
    const { batch, supersededBatch } = started
    supersededBatch?.resolve()
    this.historyScheduler.recordWrite()
    try {
      await this.navigateBatch(batch)
      if (!this.machine.finishBatch(batch.id)) return
      batch.resolve()
    } catch (error) {
      if (!this.machine.isBatchInFlight(batch.id)) return
      this.cancelBatches((canceled) => canceled.reject(error))
    }
  }

  private navigateBatch(batch: QueueBatch) {
    const options = {
      to: '.',
      search: (previous: Record<string, unknown>) => {
        if (!this.machine.isBatchInFlight(batch.id)) {
          throw new Error('Search state update was canceled')
        }
        return { ...previous, ...Object.fromEntries(batch.values) }
      },
      replace: batch.replaceHistory,
      hash: true,
      state: (previous: ParsedLocation['state']) => ({
        ...previous,
        [navigationKey]: batch.id,
      }),
      resetScroll: false,
      hashScrollIntoView: false,
    } as const
    const location = this.router.buildLocation(options)
    if (this.router.latestLocation.maskedLocation || location.maskedLocation) {
      throw new Error('useSearchState does not support route masks yet')
    }
    this.router.matchRoutes(
      location.pathname,
      this.router.options.parseSearch(location.searchStr),
      { throwOnError: true },
    )
    return this.router.navigate(options)
  }

  private cancelBatches(settle = (batch: QueueBatch) => batch.resolve()) {
    this.historyScheduler.cancel()
    const { pending, inFlight } = this.machine.clear()
    if (pending) settle(pending)
    if (inFlight) settle(inFlight)
  }
}

const queues = new WeakMap<AnyRouter, SearchStateQueue>()

export function getSearchStateQueue(router: AnyRouter) {
  let queue = queues.get(router)
  if (!queue) {
    queue = new SearchStateQueue(router)
    queues.set(router, queue)
  }
  return queue
}

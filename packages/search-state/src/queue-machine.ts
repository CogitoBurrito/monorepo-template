import { createStore } from '@tanstack/react-store'

let nextBatchId = 0

export type QueueBatch = Readonly<{
  id: number
  values: ReadonlyMap<string, unknown>
  replaceHistory: boolean
  navigationStarted: boolean
  promise: Promise<void>
  resolve: () => void
  reject: (error: unknown) => void
}>

export type QueueState = Readonly<{
  pending?: QueueBatch
  inFlight?: QueueBatch
}>

type QueueUpdate =
  | Readonly<{
    batch: QueueBatch
    promise: Promise<void>
    shouldSchedule: true
  }>
  | Readonly<{
    promise: Promise<void>
    shouldSchedule: false
  }>

type StartedBatch = Readonly<{
  batch: QueueBatch
  supersededBatch?: QueueBatch
}>

export function getOptimisticValue(
  { pending, inFlight }: QueueState,
  key: string,
  fallback: unknown,
) {
  if (pending?.values.has(key)) return pending.values.get(key)
  if (inFlight?.values.has(key)) return inFlight.values.get(key)
  return fallback
}

function createBatch(): QueueBatch {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return {
    id: ++nextBatchId,
    values: new Map(),
    replaceHistory: true,
    navigationStarted: false,
    promise,
    resolve,
    reject,
  }
}

function updateBatch(batch: QueueBatch, key: string, value: unknown, replaceHistory: boolean): QueueBatch {
  return {
    ...batch,
    values: new Map(batch.values).set(key, value),
    replaceHistory: batch.replaceHistory && replaceHistory,
  }
}

function mergeBatches(pending: QueueBatch, inFlight: QueueBatch | undefined): QueueBatch {
  if (!inFlight) return pending
  return {
    ...pending,
    values: new Map([...inFlight.values, ...pending.values]),
    replaceHistory: pending.replaceHistory && (inFlight.navigationStarted || inFlight.replaceHistory),
  }
}

export class QueueStateMachine {
  readonly store = createStore<QueueState>({})

  getOptimisticValue(key: string, fallback: unknown) {
    return getOptimisticValue(this.store.get(), key, fallback)
  }

  queueUpdate(key: string, previous: unknown, next: unknown, replaceHistory: boolean): QueueUpdate {
    const { pending, inFlight } = this.store.get()
    const retryUnstartedNavigation = !pending && inFlight?.navigationStarted === false
    if (Object.is(previous, next) && !retryUnstartedNavigation) {
      return {
        promise: pending?.promise ?? inFlight?.promise ?? Promise.resolve(),
        shouldSchedule: false,
      }
    }

    const batch = updateBatch(pending ?? createBatch(), key, next, replaceHistory)
    this.store.setState((state) => ({ ...state, pending: batch }))
    if (pending) {
      return {
        promise: batch.promise,
        shouldSchedule: false,
      }
    }
    return {
      batch,
      promise: batch.promise,
      shouldSchedule: true,
    }
  }

  hasPendingBatch(batchId: number) {
    return this.store.get().pending?.id === batchId
  }

  startPendingBatch(batchId: number): StartedBatch | undefined {
    const { pending, inFlight } = this.store.get()
    if (!pending || pending.id !== batchId) return

    const batch = mergeBatches(pending, inFlight)
    this.store.setState(() => ({ inFlight: batch }))
    return { batch, supersededBatch: inFlight }
  }

  markNavigationStarted(batchId: unknown) {
    const { inFlight } = this.store.get()
    if (!inFlight || inFlight.id !== batchId || inFlight.navigationStarted) return false

    this.store.setState((state) => ({
      ...state,
      inFlight: { ...inFlight, navigationStarted: true },
    }))
    return true
  }

  isBatchInFlight(batchId: number) {
    return this.store.get().inFlight?.id === batchId
  }

  finishBatch(batchId: number) {
    const { pending, inFlight } = this.store.get()
    if (!inFlight || inFlight.id !== batchId) return false

    this.store.setState(() => pending ? { pending } : {})
    return true
  }

  clear() {
    const state = this.store.get()
    this.store.setState(() => ({}))
    return state
  }
}

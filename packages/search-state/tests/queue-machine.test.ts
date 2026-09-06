import { describe, expect, it } from 'vitest'
import { QueueStateMachine } from '../src/queue-machine'

describe('queue state machine', () => {
  it('coalesces updates into one pending batch', () => {
    const machine = new QueueStateMachine()
    const first = machine.queueUpdate('bar', 1, 2, true)
    const second = machine.queueUpdate('baz', 10, 20, false)

    expect(first.shouldSchedule).toBe(true)
    expect(second.shouldSchedule).toBe(false)
    expect(second.promise).toBe(first.promise)
    expect(machine.store.get().pending?.values).toEqual(new Map([['bar', 2], ['baz', 20]]))
    expect(machine.store.get().pending?.replaceHistory).toBe(false)
  })

  it('keeps a newer pending batch while the in-flight batch completes', () => {
    const machine = new QueueStateMachine()
    const first = machine.queueUpdate('bar', 1, 2, true)
    if (!first.shouldSchedule) throw new Error('Expected the first update to schedule a flush')

    const started = machine.startPendingBatch(first.batch.id)
    if (!started) throw new Error('Expected the pending batch to start')

    const second = machine.queueUpdate('baz', 10, 20, true)
    if (!second.shouldSchedule) throw new Error('Expected the second update to schedule a flush')

    expect(machine.finishBatch(started.batch.id)).toBe(true)
    expect(machine.store.get().pending?.id).toBe(second.batch.id)
    expect(machine.store.get().inFlight).toBeUndefined()
  })

  it('merges a superseded batch into the next navigation', () => {
    const machine = new QueueStateMachine()
    const first = machine.queueUpdate('bar', 1, 2, false)
    if (!first.shouldSchedule) throw new Error('Expected the first update to schedule a flush')

    const started = machine.startPendingBatch(first.batch.id)
    if (!started) throw new Error('Expected the pending batch to start')
    expect(machine.markNavigationStarted(started.batch.id)).toBe(true)

    const second = machine.queueUpdate('baz', 10, 20, true)
    if (!second.shouldSchedule) throw new Error('Expected the second update to schedule a flush')

    const superseding = machine.startPendingBatch(second.batch.id)
    expect(superseding?.supersededBatch?.id).toBe(started.batch.id)
    expect(superseding?.batch.values).toEqual(new Map([['bar', 2], ['baz', 20]]))
    expect(superseding?.batch.replaceHistory).toBe(true)
  })
})

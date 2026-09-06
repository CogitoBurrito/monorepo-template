import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHistoryThrottleMs, HistoryScheduler } from '../src/history-scheduler'

describe('history throttling', () => {
  it('uses 50ms for non-Safari browsers', () => {
    expect(getHistoryThrottleMs()).toBe(50)
  })

  it.each([
    ['Version/17.0 Safari/605.1.15', 120],
    ['Version/18.5 Safari/605.1.15', 120],
    ['Version/16.6 Safari/605.1.15', 320],
    ['unknown', 320],
  ])('uses a conservative Safari interval for %s', (userAgent, expected) => {
    vi.stubGlobal('GestureEvent', class { })
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent)
    expect(getHistoryThrottleMs()).toBe(expected)
  })

  it('can be imported and called without a browser', () => {
    vi.stubGlobal('window', undefined)
    expect(getHistoryThrottleMs()).toBe(50)
  })
})

describe('history scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  })

  it('does not delay the first write or an elapsed cooldown', async () => {
    const flush = vi.fn()
    const scheduler = new HistoryScheduler(flush)

    expect(scheduler.deferIfNeeded(1)).toBe(false)
    scheduler.recordWrite()
    await vi.advanceTimersByTimeAsync(50)
    expect(scheduler.deferIfNeeded(2)).toBe(false)
    expect(flush).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('waits only for the remaining cooldown', async () => {
    const flush = vi.fn()
    const scheduler = new HistoryScheduler(flush)
    scheduler.recordWrite()
    await vi.advanceTimersByTimeAsync(20)

    expect(scheduler.deferIfNeeded(1)).toBe(true)
    await vi.advanceTimersByTimeAsync(29)
    expect(flush).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(flush).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('cancels waiting work without resetting the cooldown', async () => {
    const flush = vi.fn()
    const scheduler = new HistoryScheduler(flush)
    scheduler.recordWrite()
    expect(scheduler.deferIfNeeded(1)).toBe(true)
    await vi.advanceTimersByTimeAsync(20)

    scheduler.cancel()
    expect(vi.getTimerCount()).toBe(0)
    expect(scheduler.deferIfNeeded(2)).toBe(true)
    await vi.advanceTimersByTimeAsync(29)
    expect(flush).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(flush).toHaveBeenCalledExactlyOnceWith(2)
  })
})

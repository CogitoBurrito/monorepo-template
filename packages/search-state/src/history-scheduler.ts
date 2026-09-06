import { Debouncer } from '@tanstack/react-pacer'

const historyIntervals = {
  standard: 50,
  modernSafari: 120,
  legacySafari: 320,
} as const

export function getHistoryThrottleMs(): number {
  const isSafari = typeof window !== 'undefined' && 'GestureEvent' in window
  if (!isSafari) return historyIntervals.standard

  const version = /Version\/(\d+)/i.exec(window.navigator.userAgent)?.[1]
  const isModernSafari = version !== undefined && Number(version) >= 17
  return isModernSafari ? historyIntervals.modernSafari : historyIntervals.legacySafari
}

export class HistoryScheduler {
  private lastWriteAt = -Infinity
  private readonly timer

  constructor(flush: (batchId: number) => void) {
    const remainingWait = () => Math.max(0, getHistoryThrottleMs() - (performance.now() - this.lastWriteAt))
    this.timer = new Debouncer(flush, { wait: remainingWait })
  }

  deferIfNeeded(batchId: number) {
    if (this.remainingWait() === 0) return false
    this.timer.maybeExecute(batchId)
    return true
  }

  recordWrite() {
    this.lastWriteAt = performance.now()
  }

  cancel() {
    this.timer.cancel()
  }

  private remainingWait() {
    return Math.max(0, getHistoryThrottleMs() - (performance.now() - this.lastWriteAt))
  }
}

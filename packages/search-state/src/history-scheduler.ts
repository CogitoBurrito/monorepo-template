import { Debouncer } from "@tanstack/react-pacer";

type SafariSupport = "notSafari" | "modernSafari" | "legacySafari";

/**
 * Safari rate-limits `history.pushState`/`replaceState` (about 100 calls per
 * 30 seconds since Safari 14), so write intervals branch on it. `GestureEvent`
 * only exists in Safari, and the UA major version separates modern from
 * legacy.
 */
function detectSafariSupport(): SafariSupport {
  if (typeof window === "undefined" || !("GestureEvent" in window))
    return "notSafari";

  const version = /Version\/(\d+)/i.exec(window.navigator.userAgent)?.[1];
  return version !== undefined && Number(version) >= 17 ?
      "modernSafari"
    : "legacySafari";
}

const historyIntervals = {
  standard: 50,
  modernSafari: 120,
  legacySafari: 320,
} as const;

export function getHistoryThrottleMs(): number {
  switch (detectSafariSupport()) {
    case "notSafari":
      return historyIntervals.standard;
    case "modernSafari":
      return historyIntervals.modernSafari;
    case "legacySafari":
      return historyIntervals.legacySafari;
  }
}

const urlWriteDebounceIntervals = {
  standard: 150,
  legacySafari: 320,
} as const;

/**
 * Idle window for the experimental search-state hook: rapid input must settle
 * for this long before the accumulated batch is written to the URL. Only
 * older or unknown Safari versions need the longer history-safe interval.
 */
export function getUrlWriteDebounceMs(): number {
  return detectSafariSupport() === "legacySafari" ?
      urlWriteDebounceIntervals.legacySafari
    : urlWriteDebounceIntervals.standard;
}

export class HistoryScheduler {
  private lastWriteAt = -Infinity;
  private readonly timer;

  constructor(flush: (batchId: number) => void) {
    const remainingWait = () =>
      Math.max(
        0,
        getHistoryThrottleMs() - (performance.now() - this.lastWriteAt),
      );
    this.timer = new Debouncer(flush, { wait: remainingWait });
  }

  deferIfNeeded(batchId: number) {
    if (this.remainingWait() === 0) return false;
    this.timer.maybeExecute(batchId);
    return true;
  }

  recordWrite() {
    this.lastWriteAt = performance.now();
  }

  cancel() {
    this.timer.cancel();
  }

  private remainingWait() {
    return Math.max(
      0,
      getHistoryThrottleMs() - (performance.now() - this.lastWriteAt),
    );
  }
}

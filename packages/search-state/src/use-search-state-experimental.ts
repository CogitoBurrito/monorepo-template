import { useMemo } from "react";
import { useRouter, useSearch } from "@tanstack/react-router";
import { Debouncer } from "@tanstack/react-pacer";
import { createStore, useSelector } from "@tanstack/react-store";
import type {
  AnyRouter,
  ParsedLocation,
  RegisteredRouter,
  RouteIds,
} from "@tanstack/react-router";
import type {
  SearchSchema,
  SetSearchStateOptions,
  UseSearchStateOptions,
} from "./types";
import { getUrlWriteDebounceMs } from "./history-scheduler";

export type SetSearchStateExperimental<TValue> = (
  value: TValue | ((previous: TValue) => TValue),
  options?: SetSearchStateOptions,
) => void;

/**
 * A group of search updates committed to the URL as one history entry once
 * input settles.
 */
type SearchBatch = Readonly<{
  /**
   * Stored in history state under `navigationKey` so the router subscription
   * can tell our own writes apart from external navigations.
   */
  id: number;
  search: Record<string, unknown>;
  /**
   * `true` replaces the current history entry, `false` pushes a new one.
   * A single update requesting `replace: false` makes the whole batch push.
   */
  replaceHistory: boolean;
}>;

/**
 * History-state key tagging navigations started by this hook. External
 * navigations (links, back/forward, direct `navigate` calls) never carry it.
 */
const navigationKey = "__startMonoSearchStateExperimental";

/**
 * Per-router coordinator behind `useSearchStateExperimental`.
 *
 * While updates are on their way to the URL, consumers read an optimistic
 * search snapshot (the "overlay") instead of the URL. The overlay is the
 * only reactive state; all batch coordination lives in plain fields.
 *
 * ```
 * idle ──set()──▶ scheduled ──input idle──▶ writing ──navigation settled──▶ idle
 * URL truth      overlay = batch           overlay kept   overlay dropped
 * ```
 *
 * - `set()` merges into the scheduled batch and restarts the idle window, so
 *   a burst of updates becomes one navigation with the final values.
 * - A navigation without the `navigationKey` tag was started elsewhere: the
 *   URL is the source of truth, so any pending batch is dropped and the
 *   overlay reverts to it immediately.
 * - Once a batch's navigation settles (Router resolves or rejects it), the
 *   overlay stops masking the URL — unless a newer batch replaced it first.
 */
class SearchStateWriter {
  /**
   * Optimistic search snapshot consumers read while writes are pending.
   * `null` means the URL is the truth.
   */
  readonly store = createStore<Record<string, unknown> | null>(null);

  /** Batch waiting for the idle window to close; `undefined` while writing. */
  private batch: SearchBatch | undefined;

  private lastBatchId = 0;
  private readonly urlWriteDebouncer: Debouncer<(batchId: number) => void>;

  constructor(private readonly router: AnyRouter) {
    this.urlWriteDebouncer = new Debouncer(
      (batchId: number) => this.writeBatch(batchId),
      { wait: () => getUrlWriteDebounceMs() },
    );

    // One guard covers the whole lifecycle: our own writes are tagged, every
    // other navigation reverts the overlay to the URL. The subscription lives
    // exactly as long as this writer, which the router keeps alive in a
    // WeakMap, so it is never unsubscribed explicitly.
    this.router.subscribe("onBeforeNavigate", ({ toLocation }) => {
      if (navigationKey in toLocation.state) return;
      this.revertToUrl();
    });
  }

  /**
   * Optimistically updates `key` and schedules (or extends) the batch that
   * will write it to the URL. No-op when the value is unchanged.
   */
  set<TValue>(
    key: string,
    value: TValue | ((previous: TValue) => TValue),
    options?: SetSearchStateOptions,
  ): void {
    const base = this.baseSearch();
    const previousValue = base[key] as TValue;
    const nextValue =
      typeof value === "function" ?
        (value as (previous: TValue) => TValue)(previousValue)
      : value;
    if (Object.is(nextValue, previousValue)) return;

    const batch =
      this.batch ?
        {
          ...this.batch,
          search: { ...this.batch.search, [key]: nextValue },
          replaceHistory:
            this.batch.replaceHistory && options?.replace !== false,
        }
      : {
          id: ++this.lastBatchId,
          search: { ...base, [key]: nextValue },
          replaceHistory: options?.replace !== false,
        };
    this.batch = batch;
    this.store.setState(() => batch.search);
    this.urlWriteDebouncer.maybeExecute(batch.id);
  }

  /** Updates build on the pending batch, then the overlay, then the URL. */
  private baseSearch(): Record<string, unknown> {
    return (
      this.batch?.search ??
      this.store.get() ??
      (this.router.state.location.search as Record<string, unknown>)
    );
  }

  /** Debounce callback: commit the scheduled batch if it is still current. */
  private writeBatch(batchId: number): void {
    const batch = this.batch;
    if (!batch || batch.id !== batchId) return;
    this.batch = undefined;

    try {
      const navigation = this.router.navigate({
        to: this.router.state.location.pathname,
        hash: this.router.state.location.hash,
        replace: batch.replaceHistory,
        search: batch.search as never,
        state: (previous: ParsedLocation["state"]) => ({
          ...previous,
          [navigationKey]: batch.id,
        }),
      });

      void navigation.then(
        () => this.dropOverlay(batch.search),
        () => this.dropOverlay(batch.search),
      );
    } catch {
      this.dropOverlay(batch.search);
    }
  }

  /** An external navigation won: drop the pending batch and revert to the URL. */
  private revertToUrl(): void {
    this.urlWriteDebouncer.cancel();
    this.batch = undefined;
    this.store.setState(() => null);
  }

  /**
   * Stop masking the URL once our write settled, unless a newer batch has
   * already replaced the overlay in the meantime.
   */
  private dropOverlay(overlay: Record<string, unknown>): void {
    if (this.store.get() === overlay) {
      this.store.setState(() => null);
    }
  }
}

const writers = new WeakMap<AnyRouter, SearchStateWriter>();

function getSearchStateWriter(router: AnyRouter): SearchStateWriter {
  let writer = writers.get(router);
  if (!writer) {
    writer = new SearchStateWriter(router);
    writers.set(router, writer);
  }
  return writer;
}

function getOptimisticValue(
  search: Record<string, unknown> | null,
  key: string,
  fallback: unknown,
): unknown {
  return search && Object.hasOwn(search, key) ? search[key] : fallback;
}

/**
 * Typed optimistic search-param state. `state` reflects updates immediately;
 * the URL is written once per burst after input settles.
 */
export function useSearchStateExperimental<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends RouteIds<TRouter["routeTree"]> = RouteIds<
    TRouter["routeTree"]
  >,
  const TKey extends keyof SearchSchema<TRouter, TFrom> & string =
    keyof SearchSchema<TRouter, TFrom> & string,
>({
  from,
  key,
}: UseSearchStateOptions<TRouter, TFrom, TKey>): readonly [
  state: SearchSchema<TRouter, TFrom>[TKey],
  setState: SetSearchStateExperimental<SearchSchema<TRouter, TFrom>[TKey]>,
] {
  const router = useRouter();
  const writer = getSearchStateWriter(router);
  const validated = useSearch<AnyRouter, string, true, true, unknown>({
    from,
    select: (search: Record<string, unknown>) => search[key],
  });
  const state = useSelector(
    writer.store,
    (search) => getOptimisticValue(search, key, validated),
    { compare: Object.is },
  ) as SearchSchema<TRouter, TFrom>[TKey];
  const setState = useMemo<
    SetSearchStateExperimental<SearchSchema<TRouter, TFrom>[TKey]>
  >(() => (value, options) => writer.set(key, value, options), [writer, key]);

  return [state, setState];
}

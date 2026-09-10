import { useMemo } from "react";
import { useRouter, useSearch } from "@tanstack/react-router";
import type {
  AnyRouter,
  NavigateOptions,
  RegisteredRouter,
  ValidateId,
} from "@tanstack/react-router";

type ConstrainLiteral<T, TConstraint, TDefault = TConstraint> =
  (T & TConstraint) | TDefault;

type SearchSchema<
  TRouter extends AnyRouter,
  TFrom extends keyof TRouter["routesById"],
> = keyof TRouter["routesById"][TFrom]["types"]["searchSchema"];

type AnyKey<TRouter extends AnyRouter, TKey extends string> = ConstrainLiteral<
  TKey,
  string &
    {
      [K in keyof TRouter["routesById"]]: SearchSchema<TRouter, K>;
    }[keyof TRouter["routesById"]]
>;

type FromKey<
  TRouter extends AnyRouter,
  TFrom extends string,
  TKey extends string,
> = ConstrainLiteral<
  TKey,
  string & SearchSchema<TRouter, TFrom & keyof TRouter["routesById"]>
>;

type UseSearchStateExperimentalMicrotaskOptions<
  TRouter extends AnyRouter,
  TFrom extends string,
  TStrict extends boolean,
  TKey extends string,
  TSelected,
> = (
  | {
      from?: never;
      strict: TStrict & false;
      key: AnyKey<TRouter, TKey>;
    }
  | {
      from: ValidateId<TRouter, TFrom>;
      strict?: TStrict & true;
      key: FromKey<TRouter, TFrom, TKey>;
    }
) & {
  select?: (value: ValueFrom<TRouter, TFrom, TStrict, TKey>) => TSelected;
};

type ValueFrom<
  TRouter extends AnyRouter,
  TFrom,
  TStrict extends boolean,
  TKey extends string,
> =
  TStrict extends false ?
    | undefined
    | {
        [K in keyof TRouter["routesById"]]: TKey extends (
          keyof TRouter["routesById"][K]["types"]["searchSchema"]
        ) ?
          TRouter["routesById"][K]["types"]["searchSchema"][TKey]
        : never;
      }[keyof TRouter["routesById"]]
  : TRouter["routesById"][TFrom &
      keyof TRouter["routesById"]]["types"]["searchSchema"][TKey];

export type SetSearchStateExperimentalMicrotaskOptions = Pick<
  NavigateOptions,
  | "hashScrollIntoView"
  | "reloadDocument"
  | "replace"
  | "ignoreBlocker"
  | "resetScroll"
  | "viewTransition"
>;

export type SetSearchStateExperimentalMicrotask<TValue> = (
  value: TValue | ((previous: TValue) => TValue),
  options?: SetSearchStateExperimentalMicrotaskOptions,
) => void;

type StrictValue<
  TRouter extends AnyRouter,
  TFrom extends string,
  TKey extends string,
> = ValueFrom<TRouter, TFrom, true, TKey>;

type LooseValue<TRouter extends AnyRouter, TKey extends string> = ValueFrom<
  TRouter,
  string,
  false,
  TKey
>;

export function useSearchStateExperimentalMicrotask<
  TRouter extends AnyRouter = RegisteredRouter,
  TKey extends string = string,
  TSelected = LooseValue<TRouter, TKey>,
>(
  options: UseSearchStateExperimentalMicrotaskOptions<
    TRouter,
    string,
    false,
    TKey,
    TSelected
  >,
): readonly [
  state: TSelected,
  setState: SetSearchStateExperimentalMicrotask<LooseValue<TRouter, TKey>>,
];
export function useSearchStateExperimentalMicrotask<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TKey extends string = string,
  TSelected = StrictValue<TRouter, TFrom, TKey>,
>(
  options: UseSearchStateExperimentalMicrotaskOptions<
    TRouter,
    TFrom,
    true,
    TKey,
    TSelected
  >,
): readonly [
  state: TSelected,
  setState: SetSearchStateExperimentalMicrotask<
    StrictValue<TRouter, TFrom, TKey>
  >,
];
export function useSearchStateExperimentalMicrotask({
  from,
  strict,
  key,
  select,
}: {
  from?: string;
  strict?: boolean;
  key: string;
  select?: (value: never) => unknown;
}): readonly [state: unknown, setState: unknown] {
  const searchOptions = useMemo(
    () => ({
      from,
      select: (search: Record<string, unknown>) => {
        const value = search[key];
        return select ? select(value as never) : value;
      },
      strict,
    }),
    [from, key, select, strict],
  );
  const state = useSearch<AnyRouter, string, boolean, true, unknown>(
    searchOptions as never,
  );

  const router = useRouter();
  const setState = useMemo(
    () =>
      (
        value: unknown | ((previous: unknown) => unknown),
        options?: SetSearchStateExperimentalMicrotaskOptions,
      ) =>
        setSearchValue(router, key, value, options),
    [router, key],
  );

  return [state, setState];
}

type RouterStore = {
  search: object | null;
  options: SetSearchStateExperimentalMicrotaskOptions | null;
  scheduled: boolean;
};

const routerStores = new WeakMap<AnyRouter, RouterStore>();

/**
 * Router can chain synchronous navigations through its pending location, but
 * each changed location still reaches history and unchanged locations reload.
 * This coordinator keeps a burst to one navigation and skips equal values.
 */
function setSearchValue<TValue>(
  router: AnyRouter,
  key: string,
  value: TValue | ((previous: TValue) => TValue),
  options?: SetSearchStateExperimentalMicrotaskOptions,
) {
  let store = routerStores.get(router);
  const previousSearch = store?.search ?? router.state.location.search;
  const previousValue = previousSearch[
    key as keyof typeof previousSearch
  ] as TValue;
  const nextValue =
    typeof value === "function" ?
      (value as (previous: TValue) => TValue)(previousValue)
    : value;

  if (Object.is(nextValue, previousValue)) return;

  const nextSearch = {
    ...previousSearch,
    [key]: nextValue,
  };

  if (!store) {
    store = {
      search: null,
      options: null,
      scheduled: false,
    };
    routerStores.set(router, store);
  }

  store.search = nextSearch;
  mergeOptions(store, options);

  if (store.scheduled) return;
  store.scheduled = true;

  const unsubscribe = router.subscribe("onBeforeNavigate", () => {
    store.search = null;
    store.options = null;
    store.scheduled = false;
  });

  queueMicrotask(() => {
    unsubscribe();
    const search = store.search;
    if (!store.scheduled || !search) return;

    const navigationOptions = store.options;

    void router.navigate({
      ...navigationOptions,
      hash: router.state.location.hash,
      search,
      to: router.state.location.pathname,
      replace: navigationOptions?.replace !== false,
    });

    store.search = null;
    store.options = null;
    store.scheduled = false;
  });
}

function mergeOptions(
  store: RouterStore,
  options: SetSearchStateExperimentalMicrotaskOptions | undefined,
) {
  if (!options) return;
  if (!store.options) {
    store.options = { ...options };
    return;
  }

  if (options.hashScrollIntoView) {
    store.options.hashScrollIntoView = options.hashScrollIntoView;
  }
  if (options.reloadDocument) store.options.reloadDocument = true;
  if (options.replace !== undefined) {
    store.options.replace =
      store.options.replace === false ? false : options.replace;
  }
  if (options.ignoreBlocker) store.options.ignoreBlocker = true;
  if (options.resetScroll) store.options.resetScroll = true;
  if (options.viewTransition) {
    store.options.viewTransition = options.viewTransition;
  }
}

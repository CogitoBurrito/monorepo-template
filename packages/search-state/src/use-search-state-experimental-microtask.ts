import {
  type AnyRouter,
  type NavigateOptions,
  type RegisteredRouter,
  useRouter,
  useSearch,
  type ValidateId,
} from "@tanstack/react-router";
import { useMemo } from "react";

export type SetSearchStateExperimentalMicrotask<Value> = (
  value: ((previous: Value) => Value) | Value,
  options?: SetSearchStateExperimentalMicrotaskOptions,
) => void;

export type SetSearchStateExperimentalMicrotaskOptions = Pick<
  NavigateOptions,
  | "hashScrollIntoView"
  | "ignoreBlocker"
  | "reloadDocument"
  | "replace"
  | "resetScroll"
  | "viewTransition"
>;

type AnyKey<Router extends AnyRouter, Key extends string> = ConstrainLiteral<
  Key,
  string &
  {
    [K in keyof Router["routesById"]]: SearchSchema<Router, K>;
  }[keyof Router["routesById"]]
>;

type ConstrainLiteral<T, Constraint, Default = Constraint> =
  (Constraint & T) | Default;

type FromKey<
  Router extends AnyRouter,
  From extends string,
  Key extends string,
> = ConstrainLiteral<
  Key,
  SearchSchema<Router, From & keyof Router["routesById"]> & string
>;

type LooseValue<Router extends AnyRouter, Key extends string> = ValueFrom<
  Router,
  string,
  false,
  Key
>;

type RouterStore = {
  options: SetSearchStateExperimentalMicrotaskOptions | undefined;
  scheduled: boolean;
  search: Record<string, unknown> | undefined;
};

type SearchSchema<
  Router extends AnyRouter,
  From extends keyof Router["routesById"],
> = keyof Router["routesById"][From]["types"]["searchSchema"];

type StrictValue<
  Router extends AnyRouter,
  From extends string,
  Key extends string,
> = ValueFrom<Router, From, true, Key>;

type UseSearchStateExperimentalMicrotaskOptions<
  Router extends AnyRouter,
  From extends string,
  Strict extends boolean,
  Key extends string,
  Selected,
> = (
  | {
    from: ValidateId<Router, From>;
    key: FromKey<Router, From, Key>;
    strict?: Strict & true;
  }
  | {
    from?: never;
    key: AnyKey<Router, Key>;
    strict: false & Strict;
  }
) & {
  select?: (value: ValueFrom<Router, From, Strict, Key>) => Selected;
};

type ValueFrom<
  Router extends AnyRouter,
  From,
  Strict extends boolean,
  Key extends string,
> =
  Strict extends false ?
  | undefined
  | {
    [K in keyof Router["routesById"]]: Key extends (
      keyof Router["routesById"][K]["types"]["searchSchema"]
    ) ?
    Router["routesById"][K]["types"]["searchSchema"][Key]
    : never;
  }[keyof Router["routesById"]]
  : Router["routesById"][From &
  keyof Router["routesById"]]["types"]["searchSchema"][Key];
export function useSearchStateExperimentalMicrotask<
  Router extends AnyRouter = RegisteredRouter,
  Key extends string = string,
  Selected = LooseValue<Router, Key>,
>(
  options: UseSearchStateExperimentalMicrotaskOptions<
    Router,
    string,
    false,
    Key,
    Selected
  >,
): readonly [
  state: Selected,
  setState: SetSearchStateExperimentalMicrotask<LooseValue<Router, Key>>,
];
export function useSearchStateExperimentalMicrotask<
  Router extends AnyRouter = RegisteredRouter,
  From extends string = string,
  Key extends string = string,
  Selected = StrictValue<Router, From, Key>,
>(
  options: UseSearchStateExperimentalMicrotaskOptions<
    Router,
    From,
    true,
    Key,
    Selected
  >,
): readonly [
  state: Selected,
  setState: SetSearchStateExperimentalMicrotask<StrictValue<Router, From, Key>>,
];
export function useSearchStateExperimentalMicrotask({
  from,
  key,
  select,
  strict,
}: {
  from?: string;
  key: string;
  select?: (value: never) => unknown;
  strict?: boolean;
}): readonly [state: unknown, setState: unknown] {
  const searchOptions = useMemo(
    () => ({
      from,
      select(search: Record<string, unknown>) {
        const value = search[key];
        return select ? select(value as never) : value;
      },
      strict,
    }),
    [from, key, select, strict],
  );
  const state = useSearch<AnyRouter, string, boolean>(
    searchOptions as never,
  ) as unknown;

  const router = useRouter();
  const setState = useMemo(
    () =>
      (
        value: ((previous: unknown) => unknown) | unknown,
        options?: SetSearchStateExperimentalMicrotaskOptions,
      ) => {
        setSearchValue(router, key, value, options);
      },
    [router, key],
  );

  return [state, setState];
}

const routerStores = new WeakMap<AnyRouter, RouterStore>();

function mergeOptions(
  store: RouterStore,
  options: SetSearchStateExperimentalMicrotaskOptions | undefined,
) {
  if (!options) {
    return;
  }

  if (!store.options) {
    store.options = { ...options };
    return;
  }

  if (options.hashScrollIntoView !== undefined) {
    store.options.hashScrollIntoView = options.hashScrollIntoView;
  }

  if (options.reloadDocument) {
    store.options.reloadDocument = true;
  }

  if (options.replace !== undefined) {
    store.options.replace =
      store.options.replace === false ? false : options.replace;
  }

  if (options.ignoreBlocker) {
    store.options.ignoreBlocker = true;
  }

  if (options.resetScroll) {
    store.options.resetScroll = true;
  }

  if (options.viewTransition !== undefined) {
    store.options.viewTransition = options.viewTransition;
  }
}

/**
 Router can chain synchronous navigations through its pending location, but
 each changed location still reaches history and unchanged locations reload.
 This coordinator keeps a burst to one navigation and skips equal values.
 */
function setSearchValue<Value>(
  router: AnyRouter,
  key: string,
  value: ((previous: Value) => Value) | Value,
  options?: SetSearchStateExperimentalMicrotaskOptions,
) {
  const existing = routerStores.get(router);
  const previousSearch =
    existing?.search ??
    (router.state.location.search as Record<string, unknown>);
  const previousValue = previousSearch[key] as Value;
  const nextValue =
    typeof value === "function" ?
      (value as (previous: Value) => Value)(previousValue)
      : value;

  if (Object.is(nextValue, previousValue)) {
    return;
  }

  const nextSearch = {
    ...previousSearch,
    [key]: nextValue,
  };

  const store: RouterStore = existing ?? {
    options: undefined,
    scheduled: false,
    search: undefined,
  };
  routerStores.set(router, store);

  store.search = nextSearch;
  mergeOptions(store, options);

  if (store.scheduled) {
    return;
  }

  store.scheduled = true;

  const unsubscribe = router.subscribe("onBeforeNavigate", () => {
    store.search = undefined;
    store.options = undefined;
    store.scheduled = false;
  });

  queueMicrotask(() => {
    unsubscribe();
    const { search } = store;
    if (!search || !store.scheduled) {
      return;
    }

    const navigationOptions = store.options;
    void router.navigate({
      ...navigationOptions,
      hash: router.state.location.hash,
      replace: navigationOptions?.replace !== false,
      search,
      to: router.state.location.pathname,
    });

    store.search = undefined;
    store.options = undefined;
    store.scheduled = false;
  });
}

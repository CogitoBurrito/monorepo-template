import { expectTypeOf } from "vitest";
import {
  useSearchStateExperimentalMicrotask,
  type SetSearchStateExperimentalMicrotask,
  type SetSearchStateExperimentalMicrotaskOptions,
} from "@start-mono/search-state";

export function useSearchStateExperimentalMicrotaskTypeChecks() {
  const [state, setState] = useSearchStateExperimentalMicrotask({
    from: "/foo",
    key: "bar",
  });
  expectTypeOf(state).toEqualTypeOf<number>();
  expectTypeOf(setState).toEqualTypeOf<
    SetSearchStateExperimentalMicrotask<number>
  >();
  expectTypeOf<
    keyof SetSearchStateExperimentalMicrotaskOptions
  >().toEqualTypeOf<
    | "hashScrollIntoView"
    | "ignoreBlocker"
    | "reloadDocument"
    | "replace"
    | "resetScroll"
    | "viewTransition"
  >();

  setState((previous) => previous + 1, {
    hashScrollIntoView: true,
    ignoreBlocker: true,
    reloadDocument: false,
    replace: false,
    resetScroll: false,
    viewTransition: true,
  });

  const [looseState] = useSearchStateExperimentalMicrotask({
    strict: false,
    key: "bar",
  });
  expectTypeOf(looseState).toEqualTypeOf<number | undefined>();

  const [selected, setSelected] = useSearchStateExperimentalMicrotask({
    from: "/foo",
    key: "bar",
    select: (value) => {
      expectTypeOf(value).toEqualTypeOf<number>();
      return String(value);
    },
  });
  expectTypeOf(selected).toEqualTypeOf<string>();
  expectTypeOf(setSelected).toEqualTypeOf<
    SetSearchStateExperimentalMicrotask<number>
  >();
  setSelected(2);

  const [selectedLoose] = useSearchStateExperimentalMicrotask({
    strict: false,
    key: "bar",
    select: (value) => {
      expectTypeOf(value).toEqualTypeOf<number | undefined>();
      return value ?? 0;
    },
  });
  expectTypeOf(selectedLoose).toEqualTypeOf<number>();

  // @ts-expect-error A route ID is required in strict mode.
  useSearchStateExperimentalMicrotask({ key: "bar" });
  // @ts-expect-error Unknown route IDs are not accepted.
  useSearchStateExperimentalMicrotask({ from: "/missing", key: "bar" });
  // @ts-expect-error Keys are constrained to the selected route.
  useSearchStateExperimentalMicrotask({ from: "/other", key: "bar" });
  useSearchStateExperimentalMicrotask({
    from: "/foo",
    // @ts-expect-error Loose mode cannot be scoped to a route.
    strict: false,
    key: "bar",
  });
  // @ts-expect-error Unknown search keys are not accepted in loose mode.
  useSearchStateExperimentalMicrotask({ strict: false, key: "missing" });
  // @ts-expect-error Numeric state cannot be set to a string.
  setState("2");
  // @ts-expect-error Selection does not change the setter's value type.
  setSelected("2");
}

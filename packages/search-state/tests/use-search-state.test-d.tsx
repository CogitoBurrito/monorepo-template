import { expectTypeOf } from 'vitest'
import { useSearchState } from '@start-mono/search-state'
import type { SetSearchState, SetSearchStateOptions } from '@start-mono/search-state'

export function useSearchStateTypeChecks() {
  const [state, setState] = useSearchState({ from: '/foo', key: 'bar' })
  expectTypeOf(state).toEqualTypeOf<number>()
  expectTypeOf(setState).toEqualTypeOf<SetSearchState<number>>()
  expectTypeOf<keyof SetSearchStateOptions>().toEqualTypeOf<'replace'>()

  setState(2)
  setState((previous) => {
    expectTypeOf(previous).toEqualTypeOf<number>()
    return previous + 1
  })
  setState(2, { replace: false })

  const [optional, setOptional] = useSearchState({ from: '/foo', key: 'optional' })
  expectTypeOf(optional).toEqualTypeOf<number | undefined>()
  setOptional(undefined)
  setOptional((previous) => (previous ?? 0) + 1)

  const [mode, setMode] = useSearchState({ from: '/foo', key: 'mode' })
  expectTypeOf(mode).toEqualTypeOf<'all' | 'some' | undefined>()
  setMode('some')

  const [inherited] = useSearchState({ from: '/foo/$itemId', key: 'bar' })
  expectTypeOf(inherited).toEqualTypeOf<number>()
  const [shared] = useSearchState({ from: '/foo', key: 'shared' })
  expectTypeOf(shared).toEqualTypeOf<string | undefined>()

  // @ts-expect-error A route ID is required.
  useSearchState({ key: 'bar' })
  // @ts-expect-error Unknown route IDs are not accepted.
  useSearchState({ from: '/missing', key: 'bar' })
  // @ts-expect-error Keys are constrained to the selected route.
  useSearchState({ from: '/other', key: 'bar' })
  // @ts-expect-error Unknown search keys are not accepted.
  useSearchState({ from: '/foo', key: 'missing' })
  // @ts-expect-error Numeric state cannot be set to a string.
  setState('2')
  // @ts-expect-error The updater must return the schema's value type.
  setState((previous) => String(previous))
  // @ts-expect-error Required state cannot be removed.
  setState(undefined)
  // @ts-expect-error Enum values remain narrow.
  setMode('invalid')
  // @ts-expect-error replace is a boolean.
  setState(2, { replace: 'false' })
  // @ts-expect-error Blocker bypass is intentionally unsupported.
  setState(2, { ignoreBlocker: true })
  // @ts-expect-error Document reloads are intentionally unsupported.
  setState(2, { reloadDocument: true })
  // @ts-expect-error View transitions are intentionally unsupported.
  setState(2, { viewTransition: true })
}

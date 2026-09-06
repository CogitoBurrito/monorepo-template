import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, waitFor } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  useSearchStateExperimental,
  type SetSearchStateExperimental,
} from '@start-mono/search-state'

function createExperimentRouter(
  component: () => ReactElement | null,
  entry = '/foo?bar=1&baz=10#section',
) {
  function Root(): ReactElement {
    return <Outlet />
  }

  const rootRoute = createRootRoute({ component: Root })
  const fooRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/foo',
    validateSearch: z.object({
      bar: z.number().default(0),
      baz: z.number().default(0),
    }),
    component,
  })
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/other',
    component: () => null,
  })

  return createRouter({
    routeTree: rootRoute.addChildren([fooRoute, otherRoute]),
    history: createMemoryHistory({ initialEntries: [entry] }),
    defaultPendingMinMs: 0,
  })
}

async function renderExperimentalState(entry?: string) {
  let bar!: readonly [number, SetSearchStateExperimental<number>]
  let baz!: readonly [number, SetSearchStateExperimental<number>]

  function Page() {
    bar = useSearchStateExperimental({ from: '/foo', key: 'bar' })
    baz = useSearchStateExperimental({ from: '/foo', key: 'baz' })
    return null
  }

  const router = createExperimentRouter(Page, entry)
  await router.load()
  const view = render(<RouterProvider router={router} />)

  return {
    router,
    ...view,
    get bar() { return bar },
    get baz() { return baz },
  }
}

describe('useSearchStateExperimental', () => {
  it('exposes optimistic state and batches synchronous URL updates', async () => {
    const state = await renderExperimentalState()
    const navigate = vi.spyOn(state.router, 'navigate')

    act(() => {
      expect(state.bar[1](2)).toBeUndefined()
      state.bar[1]((previous) => previous + 1)
      state.baz[1](20)
    })

    expect(state.bar[0]).toBe(3)
    expect(state.baz[0]).toBe(20)
    expect(state.router.state.location.search).toMatchObject({ bar: 1, baz: 10 })

    await waitFor(() => {
      expect(state.router.state.location.search).toMatchObject({ bar: 3, baz: 20 })
    })
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(state.router.state.location.hash).toBe('section')
  })

  it('waits for rapid input to settle before writing the URL', async () => {
    const state = await renderExperimentalState()
    const navigate = vi.spyOn(state.router, 'navigate')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    act(() => { state.bar[1](2) })
    expect(state.bar[0]).toBe(2)
    expect(navigate).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(25)
      state.bar[1](3)
    })
    expect(state.bar[0]).toBe(3)

    await act(async () => { await vi.advanceTimersByTimeAsync(149) })
    expect(navigate).not.toHaveBeenCalled()
    expect(state.router.state.location.search.bar).toBe(1)

    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(state.router.state.location.search.bar).toBe(3)
  })

  it('pushes when any update in a batch requests replace: false', async () => {
    const state = await renderExperimentalState()
    const navigate = vi.spyOn(state.router, 'navigate')
    const historyLength = state.router.history.length

    act(() => {
      state.bar[1](2)
      state.baz[1](20, { replace: false })
    })

    await waitFor(() => expect(state.router.state.location.search).toMatchObject({ bar: 2, baz: 20 }))
    expect(state.router.history.length).toBe(historyLength + 1)
    expect(navigate).toHaveBeenLastCalledWith(expect.objectContaining({
      replace: false,
      search: expect.objectContaining({ bar: 2, baz: 20 }),
    }))
  })

  it('cancels a scheduled search update when a direct navigation follows it in the same tick', async () => {
    const state = await renderExperimentalState()
    const navigate = vi.spyOn(state.router, 'navigate')

    act(() => {
      state.bar[1](2)
      void state.router.navigate({ to: '/other' })
    })

    await waitFor(() => expect(state.router.state.location.pathname).toBe('/other'))
    await act(async () => { })

    expect(navigate).toHaveBeenCalledTimes(1)
  })
})

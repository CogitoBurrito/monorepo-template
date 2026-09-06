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
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useSearchState } from '@start-mono/search-state'
import type { SetSearchState } from '@start-mono/search-state'

function createTestRouter(
  component: () => ReactElement | null,
  entry = '/foo?bar=1&baz=10#section',
  loader?: (bar: number) => void | Promise<void>,
) {
  function Root(): ReactElement {
    useSearchState({ from: '__root__', key: 'shared' })
    return <Outlet />
  }

  const rootRoute = createRootRoute({
    validateSearch: z.object({ shared: z.string().optional() }),
    component: Root,
  })
  const fooRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/foo',
    validateSearch: z.object({
      bar: z.number().default(0),
      baz: z.number().default(0),
      optional: z.number().optional(),
      mode: z.enum(['all', 'some']).optional(),
    }),
    loaderDeps: ({ search }) => ({ bar: search.bar }),
    loader: ({ deps }) => loader?.(deps.bar),
    component,
  })
  const itemRoute = createRoute({
    getParentRoute: () => fooRoute,
    path: '$itemId',
  })
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/other',
    component: () => null,
  })

  return createRouter({
    routeTree: rootRoute.addChildren([fooRoute.addChildren([itemRoute]), otherRoute]),
    history: createMemoryHistory({ initialEntries: [entry] }),
    defaultPendingMinMs: 0,
  })
}

type TestRouter = ReturnType<typeof createTestRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: TestRouter
  }
}

async function renderState(
  entry?: string,
  renders?: number[],
  loader?: (bar: number) => void | Promise<void>,
) {
  let bar!: readonly [number, SetSearchState<number>]
  let baz!: readonly [number, SetSearchState<number>]
  let peer!: readonly [number, SetSearchState<number>]
  let optional!: readonly [number | undefined, SetSearchState<number | undefined>]

  function Peer() {
    peer = useSearchState({ from: '/foo', key: 'bar' })
    return null
  }

  function Page() {
    bar = useSearchState({ from: '/foo', key: 'bar' })
    baz = useSearchState({ from: '/foo', key: 'baz' })
    optional = useSearchState({ from: '/foo', key: 'optional' })
    renders?.push(bar[0])
    return <Peer />
  }

  const router = createTestRouter(Page, entry, loader)
  await router.load()
  const view = render(<RouterProvider router={router} />)

  return {
    router,
    ...view,
    get bar() { return bar },
    get baz() { return baz },
    get peer() { return peer },
    get optional() { return optional },
  }
}

describe('useSearchState', () => {
  it('reads validated values and uses schema defaults in functional updates', async () => {
    const state = await renderState('/foo')
    expect(state.bar[0]).toBe(0)

    act(() => { state.bar[1]((previous) => previous + 1) })

    expect(state.bar[0]).toBe(1)
    await waitFor(() => expect(state.router.state.location.search.bar).toBe(1))
  })

  it('composes functional updates across hooks and keys in one navigation', async () => {
    const state = await renderState()
    const navigate = vi.spyOn(state.router, 'navigate')

    act(() => {
      state.bar[1](2)
      state.bar[1]((previous) => previous + 1)
      state.peer[1]((previous) => previous + 1)
      state.baz[1](20)
    })

    expect(state.bar[0]).toBe(4)
    expect(state.peer[0]).toBe(4)
    expect(state.baz[0]).toBe(20)
    await waitFor(() => expect(state.router.state.location.search).toMatchObject({ bar: 4, baz: 20 }))
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(state.router.state.location.hash).toBe('section')
  })

  it('replaces history by default and preserves unrelated search parameters', async () => {
    const state = await renderState('/foo?bar=1&baz=10&extra=keep#section')
    const historyLength = state.router.history.length

    act(() => { state.bar[1](2) })

    await waitFor(() => expect(state.router.state.location.search.bar).toBe(2))
    expect(state.router.history.length).toBe(historyLength)
    expect(state.router.state.location.search).toMatchObject({ baz: 10, extra: 'keep' })
  })

  it('lets any replace: false request in a batch push a history entry', async () => {
    const state = await renderState()
    const historyLength = state.router.history.length

    act(() => {
      state.bar[1](2, { replace: false })
      state.baz[1](20, { replace: true })
    })

    await waitFor(() => expect(state.router.state.location.search.bar).toBe(2))
    expect(state.router.history.length).toBe(historyLength + 1)

    await act(async () => { state.router.history.back() })
    await waitFor(() => expect(state.bar[0]).toBe(1))
    expect(state.baz[0]).toBe(10)
  })

  it('does not navigate for an unchanged value', async () => {
    const state = await renderState()
    const navigate = vi.spyOn(state.router, 'navigate')

    await act(async () => {
      state.bar[1](1)
      state.bar[1]((previous) => previous)
    })

    expect(navigate).not.toHaveBeenCalled()
  })

  it('keeps setters stable and stays on the current nested pathname', async () => {
    const state = await renderState('/foo/item-1?bar=1')
    const setBar = state.bar[1]

    await act(async () => { await setBar(2) })

    expect(state.bar[1]).toBe(setBar)
    expect(state.router.state.location.pathname).toBe('/foo/item-1')
    expect(state.bar[0]).toBe(2)
  })

  it.each([
    { userAgent: undefined, interval: 50 },
    { userAgent: 'Version/17.0 Safari/605.1.15', interval: 120 },
    { userAgent: 'Version/16.6 Safari/605.1.15', interval: 320 },
  ])('throttles URL writes at $interval ms while keeping state immediately responsive', async ({ userAgent, interval }) => {
    if (userAgent) {
      vi.stubGlobal('GestureEvent', class { })
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent)
    }
    const state = await renderState()
    const navigate = vi.spyOn(state.router, 'navigate')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })

    await act(async () => { await state.bar[1](2) })
    let flushed!: Promise<void>
    act(() => { flushed = state.bar[1](3) })
    await act(async () => { })

    expect(state.bar[0]).toBe(3)
    expect(navigate).toHaveBeenCalledTimes(1)

    act(() => { state.bar[1]((previous) => previous + 1) })
    await act(async () => { await vi.advanceTimersByTimeAsync(interval - 1) })
    expect(state.bar[0]).toBe(4)
    expect(navigate).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
      await flushed
    })
    expect(navigate).toHaveBeenCalledTimes(2)
    expect(state.router.state.location.search.bar).toBe(4)
  })

  it('does not postpone URL writes while updates keep arriving', async () => {
    const state = await renderState()
    const navigate = vi.spyOn(state.router, 'navigate')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    await act(async () => { await state.bar[1](2) })
    let flushed!: Promise<void>
    act(() => { flushed = state.bar[1](3) })
    await act(async () => { })

    for (let update = 0; update < 4; update++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(10) })
      act(() => {
        expect(state.bar[1]((previous) => previous + 1)).toBe(flushed)
      })
    }

    expect(state.bar[0]).toBe(7)
    expect(navigate).toHaveBeenCalledTimes(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
      await flushed
    })
    expect(navigate).toHaveBeenCalledTimes(2)
    expect(state.router.state.location.search.bar).toBe(7)
  })

  it('batches synchronous updates after the queue becomes idle', async () => {
    const state = await renderState()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    await act(async () => { await state.bar[1](2) })
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    const navigate = vi.spyOn(state.router, 'navigate')
    let first!: Promise<void>
    let second!: Promise<void>

    act(() => {
      first = state.bar[1](3)
      second = state.baz[1](20)
    })

    expect(first).toBe(second)
    expect(navigate).not.toHaveBeenCalled()
    await act(async () => { await first })
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(state.router.state.location.search).toMatchObject({ bar: 3, baz: 20 })
  })

  it('keeps newer updates when an earlier navigation starts asynchronously', async () => {
    const state = await renderState()
    const navigate = state.router.navigate.bind(state.router)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(state.router, 'navigate').mockImplementationOnce(async (options) => {
      await gate
      return navigate(options)
    })

    act(() => { state.bar[1](2) })
    await act(async () => { })
    act(() => { state.bar[1]((previous) => previous + 1) })
    expect(state.bar[0]).toBe(3)

    await act(async () => { release() })
    await waitFor(() => expect(state.router.state.location.search.bar).toBe(3))
    expect(state.bar[0]).toBe(3)
  })

  it('keeps the history cooldown after an earlier navigation starts late', async () => {
    const state = await renderState()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    const navigate = state.router.navigate.bind(state.router)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const navigations = vi.spyOn(state.router, 'navigate').mockImplementationOnce(async (options) => {
      await gate
      return navigate(options)
    })
    let first!: Promise<void>
    let second!: Promise<void>

    act(() => { first = state.bar[1](2) })
    await act(async () => { })
    act(() => { second = state.bar[1](3) })
    await act(async () => { await vi.advanceTimersByTimeAsync(40) })
    await act(async () => {
      release()
      await first
    })

    await act(async () => { await vi.advanceTimersByTimeAsync(49) })
    expect(navigations).toHaveBeenCalledTimes(1)
    expect(state.bar[0]).toBe(3)
    expect(state.router.state.location.search.bar).toBe(2)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
      await second
    })
    expect(navigations).toHaveBeenCalledTimes(2)
    expect(state.router.state.location.search.bar).toBe(3)
  })

  it('discards queued values and history options when another navigation wins', async () => {
    const state = await renderState()

    await act(async () => {
      state.bar[1](99, { replace: false })
      await state.router.navigate({ to: '/foo', search: { bar: 7, baz: 8 } })
    })

    expect(state.bar[0]).toBe(7)
    const historyLength = state.router.history.length
    await act(async () => { await state.bar[1]((previous) => previous + 1) })
    expect(state.bar[0]).toBe(8)
    expect(state.router.history.length).toBe(historyLength)
  })

  it('does not write an old route update after navigating away', async () => {
    const state = await renderState()

    await act(async () => {
      state.bar[1](99)
      await state.router.navigate({ to: '/other' })
    })

    expect(state.router.state.location.pathname).toBe('/other')
    expect(state.router.state.location.search.bar).toBeUndefined()
  })

  it('cancels pending work when the last consumer unmounts', async () => {
    const state = await renderState()
    const navigate = vi.spyOn(state.router, 'navigate')
    const setBar = state.bar[1]
    let flushed!: Promise<void>

    act(() => {
      flushed = setBar(2)
      state.unmount()
    })
    await flushed
    await setBar(3)

    expect(navigate).not.toHaveBeenCalled()
  })

  it('clears the wait timer when the last consumer unmounts', async () => {
    const state = await renderState()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    await act(async () => { await state.bar[1](2) })
    const navigate = vi.spyOn(state.router, 'navigate')
    let canceled!: Promise<void>

    act(() => { canceled = state.bar[1](3) })
    await act(async () => { })
    expect(vi.getTimerCount()).toBe(1)

    state.unmount()
    await canceled
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('rolls back a rejected navigation and accepts the next update', async () => {
    const state = await renderState()
    const error = new Error('Navigation failed')
    vi.spyOn(state.router, 'navigate').mockRejectedValueOnce(error)

    await act(async () => {
      await expect(state.bar[1](2)).rejects.toBe(error)
    })
    expect(state.bar[0]).toBe(1)
    expect(state.peer[0]).toBe(1)

    await act(async () => { await state.bar[1]((previous) => previous + 1) })
    expect(state.bar[0]).toBe(2)
  })

  it('rejects the pending batch when the current navigation fails', async () => {
    const state = await renderState()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    const error = new Error('Navigation failed')
    let reject!: (error: unknown) => void
    const navigation = new Promise<void>((_resolve, onReject) => { reject = onReject })
    const navigate = vi.spyOn(state.router, 'navigate').mockReturnValueOnce(navigation)
    let first!: Promise<void>
    let second!: Promise<void>

    act(() => { first = state.bar[1](2) })
    await act(async () => { })
    act(() => { second = state.baz[1](20) })
    await act(async () => { })

    await act(async () => {
      const rejected = Promise.all([
        expect(first).rejects.toBe(error),
        expect(second).rejects.toBe(error),
      ])
      reject(error)
      await rejected
    })

    expect(state.bar[0]).toBe(1)
    expect(state.baz[0]).toBe(10)
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('isolates queues belonging to different routers', async () => {
    const first = await renderState('/foo?bar=1')
    const second = await renderState('/foo?bar=20')

    await act(async () => {
      await Promise.all([first.bar[1](2), second.bar[1](21)])
    })

    expect(first.bar[0]).toBe(2)
    expect(second.bar[0]).toBe(21)
    expect(first.router.state.location.search.bar).toBe(2)
    expect(second.router.state.location.search.bar).toBe(21)
  })

  it('removes optional values without falling back to the stale URL value', async () => {
    const state = await renderState('/foo?bar=1&optional=5')
    let flushed!: Promise<void>

    act(() => { flushed = state.optional[1](undefined) })

    expect(state.optional[0]).toBeUndefined()
    await act(async () => { await flushed })
    expect(state.router.state.location.searchStr).not.toContain('optional')
  })

  it('rejects invalid runtime values before writing history', async () => {
    const state = await renderState()
    const href = state.router.history.location.href
    const navigate = vi.spyOn(state.router, 'navigate')

    await act(async () => {
      await expect(state.bar[1](Number.NaN)).rejects.toBeInstanceOf(Error)
    })

    expect(navigate).not.toHaveBeenCalled()
    expect(state.router.history.location.href).toBe(href)
    expect(state.bar[0]).toBe(1)
    await act(async () => { await state.bar[1](2) })
    expect(state.bar[0]).toBe(2)
  })

  it('does not let an earlier loader completion flash an older value', async () => {
    const renders: number[] = []
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    const state = await renderState(undefined, renders, (bar) => bar === 2 ? gate : undefined)

    act(() => { state.bar[1](2) })
    await act(async () => { })
    act(() => { state.bar[1](3) })
    expect(state.bar[0]).toBe(3)
    renders.length = 0

    await act(async () => { release() })
    await waitFor(() => expect(state.router.state.location.search.bar).toBe(3))
    expect(renders.every((value) => value === 3)).toBe(true)
  })

  it('prevents a delayed canceled navigation from changing the new route', async () => {
    const state = await renderState()
    const navigate = state.router.navigate.bind(state.router)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(state.router, 'navigate').mockImplementationOnce(async (options) => {
      await gate
      return navigate(options)
    })

    act(() => { state.bar[1](2) })
    await act(async () => { })
    await act(async () => { await state.router.navigate({ to: '/other' }) })
    await act(async () => { release() })

    expect(state.router.state.location.pathname).toBe('/other')
    expect(state.router.state.location.search.bar).toBeUndefined()
  })

  it('cancels throttled work when the user goes back', async () => {
    const state = await renderState()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
    await act(async () => { await state.bar[1](2, { replace: false }) })
    const navigate = vi.spyOn(state.router, 'navigate')

    act(() => { state.bar[1](3) })
    await act(async () => { })
    await act(async () => { state.router.history.back() })
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })

    expect(state.bar[0]).toBe(1)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('rejects masked locations without exposing their search in the visible URL', async () => {
    const state = await renderState()
    await act(async () => {
      await state.router.navigate({
        to: '/foo',
        search: { bar: 1, baz: 10 },
        mask: { to: '/other' },
      })
    })
    const visibleHref = state.router.history.location.href

    await act(async () => {
      await expect(state.bar[1](2)).rejects.toThrow('route masks')
    })

    expect(state.router.history.location.href).toBe(visibleHref)
    expect(state.bar[0]).toBe(1)
  })

  it('respects blockers and can retry the same value after they are removed', async () => {
    const state = await renderState()
    const blocker = vi.fn(() => true)
    const unblock = state.router.history.block({ blockerFn: blocker })
    let blocked!: Promise<void>

    act(() => { blocked = state.bar[1](2) })
    await act(async () => { })
    expect(blocker).toHaveBeenCalledTimes(1)
    expect(state.router.state.location.search.bar).toBe(1)

    unblock()
    await act(async () => { await state.bar[1](2) })
    await blocked

    expect(state.router.state.location.search.bar).toBe(2)
    expect(state.bar[0]).toBe(2)
  })

  it('supersedes an unresolved navigation without losing writes to other keys', async () => {
    const state = await renderState()
    const historyLength = state.router.history.length
    const navigate = state.router.navigate.bind(state.router)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(state.router, 'navigate').mockImplementationOnce(async (options) => {
      await gate
      return navigate(options)
    })
    let first!: Promise<void>

    act(() => { first = state.bar[1](2, { replace: false }) })
    await act(async () => { })
    await act(async () => { await state.baz[1](20) })
    await first
    await act(async () => { release() })

    expect(state.router.state.location.search).toMatchObject({ bar: 2, baz: 20 })
    expect(state.bar[0]).toBe(2)
    expect(state.baz[0]).toBe(20)
    expect(state.router.history.length).toBe(historyLength + 1)
  })

  it('ignores an old route setter when navigation has already started elsewhere', async () => {
    const state = await renderState()

    await act(async () => {
      const navigation = state.router.navigate({ to: '/other' })
      state.bar[1](99)
      await navigation
    })

    expect(state.router.state.location.pathname).toBe('/other')
    expect(state.router.state.location.search.bar).toBeUndefined()
  })

  it('reads server-rendered state without retaining subscriptions', async () => {
    function ServerPage() {
      const [bar] = useSearchState({ from: '/foo', key: 'bar' })
      return <span>{bar}</span>
    }

    const router = createTestRouter(ServerPage, '/foo?bar=7')
    await router.load()
    const routerSubscriptions = router.subscribers.size
    const historySubscriptions = router.history.subscribers.size
    const html = renderToString(<RouterProvider router={router} />)

    expect(html).toContain('<span>7</span>')
    expect(router.subscribers.size).toBe(routerSubscriptions)
    expect(router.history.subscribers.size).toBe(historySubscriptions)
  })
})

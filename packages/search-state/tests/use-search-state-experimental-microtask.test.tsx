import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  useSearchStateExperimentalMicrotask,
  type SetSearchStateExperimentalMicrotask,
} from "@start-mono/search-state";

function createMicrotaskRouter(component: () => ReactElement | null) {
  function Root(): ReactElement {
    return <Outlet />;
  }

  const rootRoute = createRootRoute({ component: Root });
  const fooRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/foo",
    validateSearch: z.object({
      bar: z.number().default(0),
      baz: z.number().default(0),
    }),
    component,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([fooRoute]),
    history: createMemoryHistory({
      initialEntries: ["/foo?bar=1&baz=10#section"],
    }),
    defaultPendingMinMs: 0,
  });
}

async function renderMicrotaskState() {
  let bar!: readonly [number, SetSearchStateExperimentalMicrotask<number>];
  let baz!: readonly [number, SetSearchStateExperimentalMicrotask<number>];
  let renderCount = 0;

  function Page() {
    bar = useSearchStateExperimentalMicrotask({ from: "/foo", key: "bar" });
    baz = useSearchStateExperimentalMicrotask({ from: "/foo", key: "baz" });
    renderCount += 1;
    return null;
  }

  const router = createMicrotaskRouter(Page);
  await router.load();
  const view = render(<RouterProvider router={router} />);

  return {
    router,
    ...view,
    get bar() {
      return bar;
    },
    get baz() {
      return baz;
    },
    get renderCount() {
      return renderCount;
    },
  };
}

async function renderSelectedMicrotaskState() {
  let selected!: readonly [
    boolean,
    SetSearchStateExperimentalMicrotask<number>,
  ];
  let renderCount = 0;

  function Page() {
    selected = useSearchStateExperimentalMicrotask({
      from: "/foo",
      key: "bar",
      select: (value) => value > 0,
    });
    renderCount += 1;
    return null;
  }

  const router = createMicrotaskRouter(Page);
  await router.load();
  const view = render(<RouterProvider router={router} />);

  return {
    router,
    ...view,
    get renderCount() {
      return renderCount;
    },
    get selected() {
      return selected;
    },
  };
}

describe("useSearchStateExperimentalMicrotask", () => {
  it("accumulates same-tick updates into one navigation", async () => {
    const state = await renderMicrotaskState();
    const navigate = vi.spyOn(state.router, "navigate");

    act(() => {
      expect(state.bar[1](2)).toBeUndefined();
      state.bar[1]((previous) => previous + 1);
      state.baz[1](20);
      expect(navigate).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(state.router.state.location.search).toMatchObject({
        bar: 3,
        baz: 20,
      });
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hash: "section",
        replace: true,
        search: expect.objectContaining({ bar: 3, baz: 20 }),
        to: "/foo",
      }),
    );
  });

  it("does not navigate when the value is unchanged", async () => {
    const state = await renderMicrotaskState();
    const navigate = vi.spyOn(state.router, "navigate");

    await act(async () => {
      state.bar[1](1);
      await Promise.resolve();
    });

    expect(navigate).not.toHaveBeenCalled();
  });

  it("renders once for multiple updates in the same batch", async () => {
    const state = await renderMicrotaskState();
    const initialRenderCount = state.renderCount;

    act(() => {
      state.bar[1]((previous) => previous + 1);
      state.bar[1]((previous) => previous + 1);
    });

    await waitFor(() => expect(state.bar[0]).toBe(3));
    expect(state.renderCount).toBe(initialRenderCount + 1);
  });

  it("subscribes to the value returned by select", async () => {
    const state = await renderSelectedMicrotaskState();
    const initialRenderCount = state.renderCount;

    act(() => {
      state.selected[1](2);
    });

    await waitFor(() => expect(state.router.state.location.search.bar).toBe(2));
    expect(state.selected[0]).toBe(true);
    expect(state.renderCount).toBe(initialRenderCount);

    act(() => {
      state.selected[1](-1);
    });

    await waitFor(() => expect(state.selected[0]).toBe(false));
    expect(state.renderCount).toBe(initialRenderCount + 1);
  });

  it("merges options and pushes when any update requests it", async () => {
    const state = await renderMicrotaskState();
    const navigate = vi.spyOn(state.router, "navigate");
    const historyLength = state.router.history.length;

    act(() => {
      state.bar[1](2, { replace: true, resetScroll: false });
      state.baz[1](20, { ignoreBlocker: true, replace: false });
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ignoreBlocker: true,
        replace: false,
        resetScroll: false,
      }),
    );
    expect(state.router.history.length).toBe(historyLength + 1);
  });

  it("enables boolean navigation options when any update requests them", async () => {
    const state = await renderMicrotaskState();
    const navigate = vi
      .spyOn(state.router, "navigate")
      .mockResolvedValue(undefined);

    act(() => {
      state.bar[1](2, {
        hashScrollIntoView: false,
        ignoreBlocker: true,
        reloadDocument: false,
        resetScroll: true,
        viewTransition: false,
      });
      state.baz[1](20, {
        hashScrollIntoView: true,
        ignoreBlocker: false,
        reloadDocument: true,
        resetScroll: false,
        viewTransition: true,
      });
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hashScrollIntoView: true,
        ignoreBlocker: true,
        reloadDocument: true,
        replace: true,
        resetScroll: true,
        viewTransition: true,
      }),
    );
  });

  it("does not reuse navigation options in the next batch", async () => {
    const state = await renderMicrotaskState();
    const navigate = vi.spyOn(state.router, "navigate");
    const historyLength = state.router.history.length;

    act(() => {
      state.bar[1](2, { replace: false });
    });

    await waitFor(() => expect(state.bar[0]).toBe(2));
    expect(navigate).toHaveBeenLastCalledWith(
      expect.objectContaining({ replace: false }),
    );
    expect(state.router.history.length).toBe(historyLength + 1);

    act(() => {
      state.bar[1](3);
    });

    await waitFor(() => expect(state.bar[0]).toBe(3));
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith(
      expect.objectContaining({ replace: true }),
    );
    expect(state.router.history.length).toBe(historyLength + 1);
  });

  it("starts the next batch from the URL after an external navigation", async () => {
    const state = await renderMicrotaskState();
    const navigate = vi.spyOn(state.router, "navigate");

    act(() => {
      state.bar[1](2);
      void state.router.navigate({
        to: "/foo",
        search: { bar: 5, baz: 30 },
      });
    });

    await waitFor(() => {
      expect(state.router.state.location.search).toMatchObject({
        bar: 5,
        baz: 30,
      });
    });
    expect(navigate).toHaveBeenCalledTimes(1);

    act(() => {
      state.baz[1](40);
    });

    await waitFor(() => {
      expect(state.router.state.location.search).toMatchObject({
        bar: 5,
        baz: 40,
      });
    });
    expect(navigate).toHaveBeenCalledTimes(2);
  });
});

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  vi.useRealTimers();
});

// happy-dom does not implement scrolling; swallow scroll events instead of
// assigning over the global window.scrollTo.
window.addEventListener("scroll", vi.fn(), { passive: true });

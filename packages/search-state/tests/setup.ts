import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  vi.useRealTimers();
});

// jsdom does not implement scrolling; swallow scroll events instead of
// assigning over the global window.scrollTo.
window.addEventListener("scroll", () => {}, { passive: true });

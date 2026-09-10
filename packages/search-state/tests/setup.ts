import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  vi.useRealTimers();
});

window.scrollTo = vi.fn();

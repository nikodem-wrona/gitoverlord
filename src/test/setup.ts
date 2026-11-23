import "@testing-library/jest-dom/vitest";
import { clearMocks } from "@tauri-apps/api/mocks";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { mockReducedMotion } from "./matchMedia";

beforeEach(() => {
  mockReducedMotion(true);
});

afterEach(() => {
  cleanup();
  clearMocks();
  localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

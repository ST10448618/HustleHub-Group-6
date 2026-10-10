import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Recharts' <ResponsiveContainer> needs ResizeObserver, which jsdom
// doesn't provide. A do-nothing version is enough: tests check what a
// chart says (its accessible summary), not how it is drawn.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeEach(() => {
  // Every test starts with clean mocks, so one test's pretend server
  // answers can never leak into the next.
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
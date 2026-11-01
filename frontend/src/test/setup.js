import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Logging out asks the API to revoke the token (see sessionService).
// Tests never touch the network, so it is replaced with a do-nothing
// mock everywhere. sessionService.test.js tests the real one.
vi.mock('../services/sessionService', () => ({
  revokeSession: vi.fn()
}));

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